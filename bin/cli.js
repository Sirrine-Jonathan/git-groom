#!/usr/bin/env node
import picocolors from 'picocolors'
import main from '../src/main.js'

console.log(picocolors.green('🧹 Starting git-groom...'))
const success = await main()
if (!success) {
  console.log(picocolors.red('Error: Could not clean up repository'))
} else {
  console.log(picocolors.green('🧹 Finished successfully!'))
}
