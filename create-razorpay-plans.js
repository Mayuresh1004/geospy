// Script to create Razorpay subscription plans
// Run with: node create-razorpay-plans.js

const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_eK07AhwRplTrdl',
  key_secret: 'vumMC03vgsIJuqPEyIvxF4Zb'
});

async function createSubscriptionPlans() {
  console.log('🚀 Creating Razorpay subscription plans...\n');

  try {
    // Create Starter Plan (₹19/month)
    console.log('1. Creating Starter Plan...');
    const starterPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'Starter Plan',
        amount: 1900, // ₹19.00 in paise
        currency: 'INR',
        description: 'Basic starter plan with essential features'
      },
      notes: {
        plan_type: 'starter',
        features: 'Basic features, limited usage'
      }
    });
    console.log('✅ Starter Plan created:', {
      id: starterPlan.id,
      amount: `₹${starterPlan.item.amount / 100}`,
      period: `${starterPlan.interval} ${starterPlan.period}`
    });

    // Create Pro Plan (₹49/month)
    console.log('\n2. Creating Pro Plan...');
    const proPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'Pro Plan',
        amount: 4900, // ₹49.00 in paise
        currency: 'INR',
        description: 'Professional plan with advanced features'
      },
      notes: {
        plan_type: 'pro',
        features: 'Advanced features, unlimited usage'
      }
    });
    console.log('✅ Pro Plan created:', {
      id: proPlan.id,
      amount: `₹${proPlan.item.amount / 100}`,
      period: `${proPlan.interval} ${proPlan.period}`
    });

    console.log('\n🎉 Plans created successfully!');
    console.log('\n📝 Update your .env.local file with these plan IDs:');
    console.log(`RAZORPAY_STARTER_PLAN_ID=${starterPlan.id}`);
    console.log(`RAZORPAY_PRO_PLAN_ID=${proPlan.id}`);

    console.log('\n📋 Plan Details:');
    console.log('Starter Plan:', {
      id: starterPlan.id,
      name: starterPlan.item.name,
      amount: `₹${starterPlan.item.amount / 100}/month`,
      currency: starterPlan.item.currency
    });
    console.log('Pro Plan:', {
      id: proPlan.id,
      name: proPlan.item.name,
      amount: `₹${proPlan.item.amount / 100}/month`,
      currency: proPlan.item.currency
    });

  } catch (error) {
    console.error('❌ Error creating plans:', error);
    
    if (error.statusCode === 401) {
      console.log('💡 Check your Razorpay API credentials');
    } else if (error.statusCode === 400) {
      console.log('💡 Check the plan parameters');
      console.log('Error details:', error.error);
    }
  }
}

async function listExistingPlans() {
  console.log('🔍 Checking existing plans...\n');
  
  try {
    const plans = await razorpay.plans.all({ count: 10 });
    
    if (plans.items.length === 0) {
      console.log('No existing plans found. Creating new ones...\n');
      return false;
    }
    
    console.log(`Found ${plans.items.length} existing plans:`);
    plans.items.forEach(plan => {
      console.log(`- ${plan.item.name}: ${plan.id} (₹${plan.item.amount / 100}/${plan.period})`);
    });
    
    // Check if we already have starter and pro plans
    const hasStarter = plans.items.some(plan => 
      plan.item.name.toLowerCase().includes('starter') || 
      plan.notes?.plan_type === 'starter'
    );
    const hasPro = plans.items.some(plan => 
      plan.item.name.toLowerCase().includes('pro') || 
      plan.notes?.plan_type === 'pro'
    );
    
    if (hasStarter && hasPro) {
      console.log('\n✅ Starter and Pro plans already exist!');
      console.log('You can use the existing plan IDs in your .env.local file.');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error listing plans:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const hasExistingPlans = await listExistingPlans();
  
  if (!hasExistingPlans) {
    await createSubscriptionPlans();
  }
}

main();