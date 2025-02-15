import picocolors from 'picocolors'
import { execa } from 'execa'
import inquirer from 'inquirer'

const prompt = inquirer.createPromptModule()

async function groomBranch(branch) {
  console.log(picocolors.green(`🧹 Cleaning up Git for branch: ${branch}`))

  try {
    // List local branches that have been merged to the specified branch
    const { stdout: localBranches } = await execa('git', ['branch', '--merged'])
    const branchesToDelete = localBranches
      .split('\n')
      .filter((branchLine) => branchLine && !branchLine.startsWith('*'))
      .filter((branchLine) => branchLine !== branch)
      .map((branchLine) => branchLine.trim())

    if (branchesToDelete.length > 0) {
      console.log(picocolors.red('Merged local branches to delete:'))
      branchesToDelete.forEach((branchName) => {
        console.log(`- ${picocolors.yellow(branchName)}`)
      })
      const confirmDelete = await prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete these branches?',
      })

      if (confirmDelete.confirm) {
        console.log(picocolors.green('Deleting branches...'))
        await Promise.all(
          branchesToDelete.map((branchName) =>
            execa('git', ['branch', '-d', branchName])
          )
        ).then((results) => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.log(
                picocolors.red(`Error deleting ${branchesToDelete[index]}`)
              )
            }
          })
          const allGood = results.every(
            (result) => result.status === 'fulfilled'
          )
          if (allGood) {
            console.log(picocolors.green('All branches deleted successfully.'))
          } else {
            console.log(
              picocolors.red('Some branches were not deleted successfully.')
            )
          }
          console.log(picocolors.green('Finished deleting branches.'))
        })
      } else {
        console.log(picocolors.yellow('Skipping branch deletion.'))
      }
    } else {
      console.log(picocolors.yellow('No merged local branches to delete.'))
    }

    // List and delete merged tags
    const { stdout: tags } = await execa('git', ['tag', '--merged', branch])
    const tagsToDelete = tags.split('\n').filter((tag) => tag)

    if (tagsToDelete.length > 0) {
      console.log(picocolors.red('Merged tags to delete:'))
      tagsToDelete.forEach((tag) => {
        console.log(`- ${picocolors.yellow(tag)}`)
      })
      const confirmDelete = await prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete these tags?',
      })
      if (confirmDelete.confirm) {
        await Promise.all(
          tagsToDelete.map((tag) => execa('git', ['tag', '-d', tag]))
        ).then((results) => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.log(
                picocolors.red(`Error deleting ${tagsToDelete[index]}`)
              )
            }
          })
          const allGood = results.every(
            (result) => result.status === 'fulfilled'
          )
          if (allGood) {
            console.log(picocolors.green('All tags deleted successfully.'))
          } else {
            console.log(
              picocolors.red('Some tags were not deleted successfully.')
            )
          }
          console.log(picocolors.green('Finished deleting tags.'))
        })
      } else {
        console.log(picocolors.yellow('Skipping tag deletion.'))
      }
    } else {
      console.log(picocolors.yellow('No merged tags to delete.'))
    }

    const remotes = await getRemotes()
    const remoteNames = remotes.map((remote) => remote.split('\t')[0])
    const noRemotes = remotes.length === 0
    if (!noRemotes && remoteNames.some((name) => name === 'origin')) {
      // Prune remote-tracking branches that no longer exist on the remote
      console.log(picocolors.green('Pruning stale remote-tracking branches...'))
      await execa('git', ['remote', 'prune', 'origin'])

      const viewRemotes = await prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to look at deleting merged remote branches?',
      })

      if (viewRemotes.confirm) {
        // List and delete merged remote branches
        const { stdout: remoteBranches } = await execa('git', [
          'branch',
          '-r',
          '--merged',
          branch,
        ])
        const remoteBranchesToDelete = remoteBranches
          .split('\n')
          .filter(
            (branchLine) =>
              branchLine &&
              !branchLine.includes('origin/HEAD') && // Skip HEAD ref
              !branchLine.includes(`origin/${branch}`) // Skip the main branch
          )
          .map((branchLine) => branchLine.trim())

        if (remoteBranchesToDelete.length > 0) {
          console.log(picocolors.red('Merged remote branches to delete:'))
          remoteBranchesToDelete.forEach((remoteBranch) => {
            console.log(`- ${picocolors.yellow(remoteBranch)}`)
          })
          const confirmDelete = await prompt({
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete these remote branches?',
          })
          if (confirmDelete.confirm) {
            await Promise.all(
              remoteBranchesToDelete
                .map((remoteBranch) => {
                  return remoteBranch.replace('origin/', '')
                })
                .map((remoteBranch) => {
                  return execa('git', [
                    'push',
                    'origin',
                    '--delete',
                    remoteBranch,
                  ])
                })
            ).then((results) => {
              results.forEach((result, index) => {
                if (result.status === 'rejected') {
                  console.log(
                    picocolors.red(
                      `Error deleting ${remoteBranchesToDelete[index]}`
                    )
                  )
                }
              })

              const allGood = results.every(
                (result) => result.status === 'fulfilled'
              )

              if (allGood) {
                console.log(
                  picocolors.green('All remote branches deleted successfully.')
                )
              } else {
                const theBad = results.filter(
                  (result) => result.status === 'rejected'
                )
                console.log(
                  picocolors.red(
                    'Some remote branches were not deleted successfully.'
                  )
                )
                theBad.forEach((result) => {
                  console.log(picocolors.red(result.stderr))
                })
              }
              console.log(
                picocolors.green('Finished deleting remote branches.')
              )
            })
          } else {
            console.log(picocolors.yellow('Skipping remote branch deletion.'))
          }
        } else {
          console.log(picocolors.yellow('No merged remote branches to delete.'))
        }
      } else {
        console.log(picocolors.yellow('Skipping remote branch deletion.'))
      }
    }
  } catch (error) {
    console.error(picocolors.red('Error occurred during cleanup:'), error)
  }
}

export default groomBranch
