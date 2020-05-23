"use strict";
const fs = require("fs"),
	path = require("path"),
	crypto = require("crypto"),
	{ exec } = require("child_process");

const workspacePath = process.env['GITHUB_WORKSPACE'];
process.chdir(workspacePath);

const IGNORED_FILES = ["manifest.json", "manifest-generator.js", "manifest-generator.bat", "manifest-generator.exe", "node.exe"];
const IGNORED_START_SYMBOL = [".", "_"];

//load predefined manifest
let manifest = undefined;
try {
	manifest = JSON.parse(fs.readFileSync(path.join(workspacePath, "manifest.json")));
	if (manifest && typeof manifest === "object") {
		if (!manifest.files) manifest.files = {};
	}
	else manifest = { "files": {} };
}
catch (err) { manifest = { "files": {} };}

//cleanup manifest
Object.keys(manifest.files).forEach(entry => {
	try { fs.accessSync(path.join(workspacePath, entry), fs.constants.F_OK) }
	catch (err) { delete manifest.files[entry]; }
});

//recursive file gather
function findInDirRelative(dir, fileList = []) {
	const files = fs.readdirSync(dir);
	files.forEach((file) => {
		const filePath = path.join(dir, file);
		const fileStat = fs.lstatSync(filePath);
		if (!IGNORED_FILES.includes(file) && !IGNORED_START_SYMBOL.includes(file[0])) {
			if (fileStat.isDirectory()) findInDirRelative(filePath, fileList);
			else fileList.push(path.relative(workspacePath, filePath));
		}
	});
	return fileList;
}

//generate hash
const files = findInDirRelative(workspacePath);
files.forEach(filePath => {
	let file = filePath.replace(/\\/g, "/");
	if (manifest.files[file] && typeof manifest.files[file] === "object") {
		manifest.files[file].hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(workspacePath, file))).digest("hex");
	}
	else
		manifest.files[file] = crypto.createHash("sha256").update(fs.readFileSync(path.join(workspacePath, file))).digest("hex");
})

//save file
fs.writeFileSync(path.join(workspacePath, "manifest.json"), JSON.stringify(manifest, null, "\t"), "utf8");

exec('git status --porcelain', (err, stdout) => {
	if (err) {
		console.error(err.toString());
		process.exit(err.code || -1);
	}
	
	if (stdout.length) {
		exec(`git add manifest.json && git -c user.name="${process.env['INPUT_USER_NAME']}" -c user.email="${process.env['INPUT_USER_EMAIL']}" -c core.autocrlf=false commit -m "${process.env['INPUT_COMMIT_MESSAGE']}" --author="${process.env['INPUT_COMMIT_AUTHOR']}" && git push`, (err) => {
			if (err) {
				console.error(err.toString());
				process.exit(err.code || -1);
			} else {
				console.log("Updated manifest.json successfully.");
			}
		});
	} else {
		console.log("No changes to manifest.json.");
	}
});
