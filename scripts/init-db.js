#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script sets up the database with the initial schema and subscription plans.
 * Run this after setting up your Supabase project.
 * 
 * Usage: node scripts/init-db.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '')
        if (value) {
          process.env[key.trim()] = value
        }
      }
    })
  }
}

async function initializeDatabase() {
  console.log('🚀 Initializing database...')

  // Load environment variables
  loadEnvFile()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Execute the initial schema
    console.log('📦 Setting up initial schema...')
    const initialSchema = fs.readFileSync(
      path.join(__dirname, '001_initial_schema.sql'),
      'utf8'
    )
    
    // Note: In a real setup, you'd need to run this SQL through the Supabase dashboard or CLI
    console.log('✅ Initial schema ready to be executed')
    console.log('📝 Please run the SQL files in your Supabase SQL editor:')
    console.log('   1. scripts/001_initial_schema.sql')
    console.log('   2. scripts/002_subscription_plans.sql')

    // Check if subscription_plans table exists and has data
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .limit(1)

    if (plansError) {
      console.log('ℹ️  subscription_plans table not found - please run the SQL scripts first')
    } else if (plans && plans.length > 0) {
      console.log('✅ Subscription plans already exist in database')
      
      // Fetch and display existing plans
      const { data: allPlans } = await supabase
        .from('subscription_plans')
        .select('id, name, price, currency, billing_period')
        .eq('is_active', true)
        .order('price')

      if (allPlans && allPlans.length > 0) {
        console.log('\n📋 Current subscription plans:')
        allPlans.forEach(plan => {
          console.log(`   • ${plan.name}: $${plan.price}/${plan.billing_period}`)
        })
      }
    } else {
      console.log('ℹ️  No subscription plans found - please run scripts/002_subscription_plans.sql')
    }

    console.log('\n🎉 Database initialization check complete!')
    console.log('\n📚 Next steps:')
    console.log('   1. Run the SQL scripts in your Supabase dashboard')
    console.log('   2. Set up your payment provider credentials (Stripe/Razorpay)')
    console.log('   3. Test the subscription flow in your application')

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  initializeDatabase()
}

module.exports = { initializeDatabase }