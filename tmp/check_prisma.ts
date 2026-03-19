import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Checking platformReport model...');
  if (prisma && (prisma as any).platformReport) {
    console.log('✅ platformReport IS available on the prisma client instance.');
  } else {
    console.log('❌ platformReport IS NOT available on the prisma client instance.');
    console.log('Available keys:', Object.keys(prisma).filter(k => !k.startsWith('$')));
  }
  
  console.log('Checking User fields...');
  // This is a bit harder without a real user, but we can check the metadata
  try {
     const userModel = (prisma as any).user;
     if (userModel) {
        console.log('✅ User model exists.');
     }
  } catch(e) {}
}

main().catch(console.error);
