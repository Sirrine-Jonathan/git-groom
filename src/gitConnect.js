import { execa } from 'execa'
const GitConnectFactory = () => ({
  async isGitRepo() {
    try {
      const { stdout } = await execa('git', [
        'rev-parse',
        '--is-inside-work-tree',
      ])
      return stdout.trim() === 'true'
    } catch (err) {
      console.log({ err })
      return false
    }
  },

  async hasCommits() {
    try {
      await execa('git', ['rev-parse', 'HEAD'])
      return true
    } catch {
      return false
    }
  },

  async hasRemoteOrigin() {
    try {
      await execa('git', ['remote', 'get-url', 'origin'])
      return true
    } catch {
      return false
    }
  },

  async getBranches() {
    try {
      const { stdout } = await execa('git', ['branch'])
      const branches = stdout
        .split('\n')
        .map((line) => {
          const branch = line.split(' ').pop() // Get the last word (branch name)
          return branch
        })
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      return branches
    } catch (error) {
      return []
    }
  },

  async getDefaultBranch() {
    try {
      const { stdout } = await execa('git', ['remote', 'show', 'origin'])
      const match = stdout.match(/HEAD branch: (.+)/)
      if (match && !match[1].toLowerCase().trim().includes('unknown')) {
        return match[1]
      }
      return null
    } catch (error) {
      return null
    }
  },
})

export default GitConnectFactory()
