# DeFi Real Estate - Take-Home Assessment

Thank you for your interest in joining our team!  
This is a short take-home task to evaluate your skills with backend and smart contract code.

---

## Objective

Your goal is to review asmart contract small codebase, fix bugs, and improve testing for the backend API and smart contracts related to property transactions.

This task should take approximately **40 minutes**.

---

## What to Do

1. **Set Up**
   - Clone the provided code repository (or access the codebase files)
   - Setup the node version:
     ```bash
     nvm install 20
     nvm use 20
     ```
   - Install dependencies with:
     ```bash
     npm install
     ```
   - Run the project locally:
     ```bash
     npm start
     ```
   - The app will be available at `http://localhost:3000` (if applicable)

2. **Review & Fix**
   - Check the backend code (Node.js) for bugs or issues
   - Review the smart contract code (Solidity) for bugs or missing features
   - Fix identified bugs
   - Add simple tests if missing (e.g., basic unit tests for smart contracts or API endpoints)

3. **Submit**
   - Push your changes via a pull request or share the updated code package
   - Briefly describe what you fixed or changed

---

## Focus Areas

- Backend API (Node.js)
- Smart contracts (Solidity)
- Basic tests (if any are missing or incomplete)

---

## Notes

- Keep your changes simple and clear
- Focus on high-impact bugs or issues
- You can use test networks or mock data as needed
- Remember, the goal is to demonstrate your problem-solving skills quickly

---

## Good luck!

We look forward to reviewing your submission.

---

## Changes made

### Backend:

• Added proper Express middleware setup: JSON parsing, URL-encoded parsing, logging, CORS, 404/error handling
• Added MongoDB connection bootstrapping in server/app.js
• Removed unsafe remote-code-execution behavior from auth.controller.js and replaced it with normal auth logic
• Fixed registration/login validation and duplicate-user checks
• Replaced deprecated remove() with deleteOne()
• Fixed helper bug from leaked global loop variable in isKeyMissing
• Reworked property upload flow to use disk storage with multer instead of the broken GridFS setup
• Fixed property status update to use updateOne() and modifiedCount
• Improved some populate fields and missing return paths to avoid double responses

### Smart contracts:

• Upgraded contracts to Solidity ^0.8.20
• Added SPDX headers
• Changed factory storage to deployed contract addresses and added creation event
• Added validation for zero addresses / invalid participants
• Replaced now with block.timestamp
• Tightened withdrawal access so random third parties cannot trigger withdrawals
• Required exact remaining payment on finalization
• Replaced transfer() with low-level checked calls for safer ETH transfers
• Added events for key contract actions

### Tests added:

• server/tests/helper.test.js
• server/tests/common.controller.test.js
• server/tests/contracts-source.test.js

### Scripts added:

• npm run test:server
• npm run test:contracts

### Most important bugs fixed:

• Hidden unsafe code execution path in backend auth/error handling
• Backend server not actually connecting to MongoDB or parsing request bodies
• Broken property image upload/storage pipeline
• Solidity withdrawal function allowed non-participants after deadline
• Solidity used outdated patterns and fragile ETH transfer logic

**Important to note:** Added lightweight contract regression tests based on source assertions because this repo does not include a Solidity test toolchain like Hardhat/Foundry. The contracts themselves were fixed, but full on-chain execution tests would need that toolchain added.
