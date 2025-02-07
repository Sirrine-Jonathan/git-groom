#!/usr/bin/env node
const picocolors = require("picocolors");
const { execa } = require("execa");
const inquirer = require("inquirer");
const { runCleanup } = require("../src/runCleanup");
const prompt = inquirer.createPromptModule();

const sanitizeCommandLineArgument = (arg) => {
  // Remove malicious characters
  arg = arg.replace(/[^\w\s-]/gi, "");

  // Remove leading and trailing spaces
  return arg.trim();
};

async function checkIfRepoHasCommits() {
  try {
    // Try running git log to check if there are commits in the repo
    const { stdout } = await execa("git", ["log", "--oneline"]);
    return stdout.trim().length > 0;
  } catch (error) {
    return false; // No commits found
  }
}

// Function to get the default branch of the repository
async function getDefaultBranch(branches) {
  try {
    const { stdout } = await execa("git", ["remote", "show", "origin"]);
    const match = stdout.match(/HEAD branch: (.+)/);
    if (match && !match[1].toLowerCase().trim().includes("unknown")) {
      return match[1];
    }
    throw new Error("Could not determine default branch from remote.");
  } catch (error) {
    console.error(
      picocolors.yellow(
        "It looks like this repository is not connected to a remote."
      )
    );
    // List branches:
    console.log(picocolors.yellow("Available local branches:"));
    branches.forEach((branch) => {
      console.log(`- ${picocolors.yellow(branch)}`);
    });
    console.log();
    // Prompt the user to enter the default branch manually
    const answers = await prompt([
      {
        type: "input",
        name: "manualBranch",
        message: "Please enter the default branch name for this repository:",
      },
    ]);

    return answers.manualBranch;
  }
}

// Function to get recent branches from git reflog
async function getBranches() {
  try {
    const { stdout } = await execa("git", ["branch"]);
    const branches = stdout
      .split("\n")
      .map((line) => {
        const branch = line.split(" ").pop(); // Get the last word (branch name)
        return branch;
      })
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    return branches;
  } catch (error) {
    console.error("Error fetching recent branches:", error);
  }
}

// Main function to initiate the interactive cleanup
async function gitGroom() {
  // First, check if the repository has commits
  const hasCommits = await checkIfRepoHasCommits();
  const branches = await getBranches();
  const commandLineBranch = process.argv[2];
  const sanitizedCommandLineBranch = commandLineBranch
    ? sanitizeCommandLineArgument(commandLineBranch)
    : null;
  if (
    sanitizedCommandLineBranch &&
    !branches.includes(sanitizedCommandLineBranch)
  ) {
    console.log(
      picocolors.red(
        `The branch '${sanitizedCommandLineBranch}' does not exist in the repository.`
      )
    );
    branches.forEach((branch) => {
      console.log(`- ${picocolors.yellow(branch)}`);
    });
  }

  if (!hasCommits) {
    console.log(
      picocolors.green(
        "Your repository does not have any commits yet.\nCleanup skipped 😀"
      )
    );
    return;
  }

  if (!branches || branches.length === 0) {
    console.log(
      picocolors.green(
        "Your repository does not have any branches yet.\nCleanup skipped 😀"
      )
    );
    return;
  }

  // Get the default branch dynamically
  const branch =
    sanitizedCommandLineBranch || (await getDefaultBranch(branches));
  let stagedBranch = sanitizeCommandLineArgument(branch);

  while (!stagedBranch || stagedBranch.trim().toLowerCase() === "quit") {
    if (stagedBranch.trim().toLowerCase() === "quit") {
      console.log(picocolors.yellow("Quitting the cleanup process."));
      return;
    }
    stagedBranch = await getDefaultBranch(branches);
  }

  await runCleanup(stagedBranch);

  console.log(picocolors.green("Cleanup completed successfully!"));
}

// Run the interactive CLI
gitGroom();
