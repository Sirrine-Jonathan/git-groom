import picocolors from 'picocolors'
import inquirer from 'inquirer'
import GitConnect from './gitConnect.js'
import { sanitizeCommandLineArgument } from './util.js'
import groomBranch from './groomBranch.js'

const prompt = inquirer.createPromptModule()

export default async function main() {
  // Quit early if not a git repo
  const isGitRepo = await GitConnect.isGitRepo()
  if (!isGitRepo) {
    console.log(
      picocolors.green('This is not a git repository - Cleanup skipped 😀')
    )
    return true
  }

  // Quit early if no branches
  const branches = await GitConnect.getBranches()
  if (!branches || branches.length === 0) {
    console.log(
      picocolors.green(
        'Your repository does not have any branches - Cleanup skipped 😀'
      )
    )
    return true
  }

  // Quit early if no commits
  const hasCommits = await GitConnect.hasCommits()
  if (!hasCommits) {
    console.log(
      picocolors.green(
        'Your repository does not have any commits yet - Cleanup skipped 😀'
      )
    )
    return true
  }

  // Check for command line argument for branch
  const userInput = process.argv[2]
  if (userInput) {
    const suggestedBranch = sanitizeCommandLineArgument(userInput)
    const isRealBranch = branches.includes(suggestedBranch)
    if (!isRealBranch) {
      console.log(
        picocolors.yellow(`Branch '${suggestedBranch}' does not exist.`)
      )
    } else {
      return await groomBranch(suggestedBranch)
    }
  }

  // Otherwise, prompt for branch
  const defaultBranch = await GitConnect.getDefaultBranch()
  let proceedWithDefaultBranch = false
  if (defaultBranch) {
    const response = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: `Do you want to use the default branch '${defaultBranch}'?`,
      default: true,
    })
    proceedWithDefaultBranch = response.confirm
  }

  if (proceedWithDefaultBranch) {
    return await groomBranch(defaultBranch)
  }

  // mutliple choice prompt
  const branchChoices = branches.map((branch) => ({
    name: branch,
    value: branch,
  }))
  const { selectedBranch } = await prompt({
    type: 'list',
    name: 'selectedBranch',
    message: 'Select a default branch:',
    choices: branchChoices,
  })

  if (selectedBranch) {
    return await groomBranch(selectedBranch)
  }

  console.log(picocolors.green('No branch selected - Cleanup skipped 😀'))

  return true
}
