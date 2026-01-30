# Secure Sealed Bid Government Tender Portal

## 🛡️ Project Overview
This application is a specialized Government Tender Portal designed to manage high-stakes contract bidding. It mitigates "bid leaking" fraud risks using **cryptographic sealing**. Bids submitted by contractors are encrypted upon submission, ensuring that no one—not even the database administrator—can view the bid amounts until the Tender Officer initiates the "Unsealing" process using Multi-Factor Authentication (MFA).

## 🚀 Core Features
* **Sealed Submission:** Financial values are immediately encrypted (AES) and documents are hashed (SHA-256) for integrity.
* **Strict Access Control (RBAC):** Contractors see only their bids; Officers see all (sealed) bids; Auditors view logs.
* **Tamper-Proofing:** Digital signatures break if a document is altered post-submission.
* **Secure Unsealing:** A privileged action requiring MFA/OTP to decrypt bid values.

## 🛠️ Technical Stack
* **Frontend:** React.js, `axios`, `crypto-js`
* **Backend:** Node.js, Express.js, `jsonwebtoken`, `bcryptjs`, `multer`
* **Database:** MongoDB (Stores hashed credentials and encrypted bid fields)

## 🔐 Security Implementation (Rubric Compliance)

| Security Component | Implementation Detail |
| :--- | :--- |
| **Authentication** | NIST Compliance (User/Pass) + **MFA** (OTP for Unsealing) |
| **Authorization** | **RBAC Matrix** for Contractors (Create/Read Own), Officers (Read All/Unseal), and Auditors (Verify Logs) |
| **Encryption** | **AES Encryption** for the `Bid Amount` field (Decrypted only on demand) |
| **Integrity** | **SHA-256 Hashing** for document verification and digital signatures |
| **Encoding** | **Base64** encoding for license image storage and rendering |

## ⚙️ Workflow
1.  **Registration/Login:** Roles assigned (Contractor, Officer, Auditor).
2.  **Bid Creation:** Contractor inputs Amount (Encrypted) + Document (Hashed).
3.  **Management:** Dashboard shows "Sealed" data (e.g., `U2FsdGVkX1...`).
4.  **Unsealing:** Officer enters OTP -> System decrypts Amount -> Winner declared.
5.  **Audit:** Auditor reviews logs and verifies document hashes.

## 💿 Installation & Setup
*(Add your specific installation instructions here later, e.g., 'npm install')*