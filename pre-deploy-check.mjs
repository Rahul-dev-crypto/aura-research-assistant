// Pre-deployment checklist script
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Running Pre-Deployment Checklist...\n');

let allPassed = true;

// Check 1: .env.local exists
console.log('1. Checking environment file...');
if (existsSync('.env.local')) {
    console.log('   ✅ .env.local found');
    
    const envContent = readFileSync('.env.local', 'utf8');
    
    // Check required variables
    const requiredVars = [
        'GEMINI_API_KEYS',
        'MONGODB_URI',
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
    ];
    
    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            console.log(`   ✅ ${varName} is set`);
        } else {
            console.log(`   ❌ ${varName} is MISSING`);
            allPassed = false;
        }
    });
} else {
    console.log('   ❌ .env.local NOT FOUND');
    allPassed = false;
}

// Check 2: .gitignore includes .env files
console.log('\n2. Checking .gitignore...');
if (existsSync('.gitignore')) {
    const gitignoreContent = readFileSync('.gitignore', 'utf8');
    if (gitignoreContent.includes('.env')) {
        console.log('   ✅ .env files are ignored');
    } else {
        console.log('   ⚠️  .env files might not be ignored');
    }
} else {
    console.log('   ⚠️  .gitignore not found');
}

// Check 3: package.json has correct scripts
console.log('\n3. Checking package.json scripts...');
if (existsSync('package.json')) {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts.build) {
        console.log('   ✅ Build script exists');
    } else {
        console.log('   ❌ Build script MISSING');
        allPassed = false;
    }
    
    if (packageJson.scripts.start) {
        console.log('   ✅ Start script exists');
    } else {
        console.log('   ❌ Start script MISSING');
        allPassed = false;
    }
} else {
    console.log('   ❌ package.json NOT FOUND');
    allPassed = false;
}

// Check 4: Important files exist
console.log('\n4. Checking important files...');
const importantFiles = [
    'next.config.ts',
    'tsconfig.json',
    'src/app/layout.tsx',
    'src/app/page.tsx'
];

importantFiles.forEach(file => {
    if (existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
    } else {
        console.log(`   ❌ ${file} MISSING`);
        allPassed = false;
    }
});

// Check 5: MongoDB connection string format
console.log('\n5. Checking MongoDB URI format...');
if (existsSync('.env.local')) {
    const envContent = readFileSync('.env.local', 'utf8');
    const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
    
    if (mongoMatch) {
        const mongoUri = mongoMatch[1].trim();
        if (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://')) {
            console.log('   ✅ MongoDB URI format is correct');
            
            if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
                console.log('   ⚠️  WARNING: Using localhost - won\'t work in production!');
                console.log('   💡 Use MongoDB Atlas for production');
            }
        } else {
            console.log('   ❌ MongoDB URI format is invalid');
            allPassed = false;
        }
    }
}

// Check 6: Google OAuth configuration
console.log('\n6. Checking Google OAuth...');
if (existsSync('.env.local')) {
    const envContent = readFileSync('.env.local', 'utf8');
    
    const clientIdMatch = envContent.match(/NEXT_PUBLIC_GOOGLE_CLIENT_ID=(.+)/);
    const clientSecretMatch = envContent.match(/GOOGLE_CLIENT_SECRET=(.+)/);
    
    if (clientIdMatch && clientIdMatch[1].trim()) {
        console.log('   ✅ Google Client ID is set');
    } else {
        console.log('   ⚠️  Google Client ID is empty');
    }
    
    if (clientSecretMatch && clientSecretMatch[1].trim()) {
        console.log('   ✅ Google Client Secret is set');
    } else {
        console.log('   ⚠️  Google Client Secret is empty');
    }
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('✅ All critical checks PASSED!');
    console.log('🚀 You\'re ready to deploy!');
    console.log('\nNext steps:');
    console.log('1. Push your code to GitHub');
    console.log('2. Deploy to Vercel/Netlify/Railway');
    console.log('3. Add environment variables in deployment platform');
    console.log('4. Update Google OAuth redirect URIs');
    console.log('\nSee DEPLOYMENT_GUIDE.md for detailed instructions.');
} else {
    console.log('❌ Some checks FAILED!');
    console.log('⚠️  Please fix the issues above before deploying.');
}
console.log('='.repeat(50) + '\n');

process.exit(allPassed ? 0 : 1);
