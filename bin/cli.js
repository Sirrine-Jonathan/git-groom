#!/usr/bin/env node
const picocolors = require("picocolors");
const { execa } = require("execa");
const inquirer = require("inquirer");
const prompt = inquirer.createPromptModule();

async function checkIfRepoHasCommits() {
  try {
    // Try running git log to check if there are commits in the repo
    await execa("git", ["log", "--oneline"]);
    return true; // Repo has commits
  } catch (error) {
    return false; // No commits found
  }
}

// Function to get the default branch of the repository
async function getDefaultBranch() {
  try {
    const { stdout } = await execa("git", ["remote", "show", "origin"]);
    const match = stdout.match(/HEAD branch: (.+)/);
    if (match) {
      return match[1];
    }
    throw new Error("Could not determine default branch.");
  } catch (error) {
    // Check if the error was due to a missing origin or connectivity issues
    if (
      error.message.includes(
        "fatal: 'origin' does not appear to be a git repository"
      ) ||
      error.message.includes("fatal: Could not read from remote repository")
    ) {
      console.error(
        picocolors.yellow(
          "It looks like this repository is not connected to a remote."
        )
      );
      // Prompt the user to enter the default branch manually
      prompt([
        {
          type: "input",
          name: "manualBranch",
          message: "Please enter the default branch name for this repository:",
        },
      ]).then((answers) => {
        return answers.manualBranch;
      });
    } else {
      console.error(
        picocolors.red(`Error fetching default branch: ${error.message}`)
      );
    }

    // Return fallback branch name if error occurs
    console.log("Returning fallback branch name 'main'");
    return "main"; // You can modify this if you want a different fallback
  }
}

// Function to get recent branches from git reflog
async function getRecentBranches() {
  try {
    const { stdout } = await execa("git", ["reflog", "--date=short"]);
    const branches = stdout
      .split("\n")
      .filter((line) => line.includes("checkout"))
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

// Function to perform cleanup
async function runCleanup(branch) {
  console.log(
    picocolors.green(
      `Cleaning up Git for branch: ${branch || "current branch"}`
    )
  );

  // Perform Git operation, e.g., listing branches
  const { stdout } = await execa("git", ["branch"]);
  console.log(picocolors.blue("Current branches:"));
  console.log(stdout);
}

// Main function to initiate the interactive cleanup
async function gitGroom() {
  // First, check if the repository has commits
  const hasCommits = await checkIfRepoHasCommits();

  if (!hasCommits) {
    console.log(
      picocolors.red(
        "Error: Your repository does not have any commits yet. Cleanup cannot be performed."
      )
    );
    return;
  }

  // Get the default branch dynamically
  const defaultBranch = await getDefaultBranch();

  // Get branch name from command line argument or default to the default branch
  const branch = process.argv[2] || defaultBranch;

  const branches = await getRecentBranches();
  if (!branches || branches.length === 0) {
    console.log(picocolors.red("No recent branches found."));
    return;
  }

  console.log(picocolors.green(`Target branch for cleanup: ${branch}`));

  // Prompt the user to select a branch to clean
  const { selectedBranch } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedBranch",
      message: "Which branch do you want to clean?",
      choices: branches,
    },
  ]);

  // Confirm cleanup of selected branch
  const { confirmCleanup } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmCleanup",
      message: `Are you sure you want to clean up the branch ${selectedBranch}?`,
      default: false,
    },
  ]);

  if (confirmCleanup) {
    await runCleanup(selectedBranch);
  } else {
    console.log(picocolors.yellow("Cleanup aborted."));
  }
}

// Run the interactive CLI
gitGroom();
