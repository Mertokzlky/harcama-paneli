import { demoAuthService, demoTransactionService } from './demo'
import { firebaseAuthService } from './firebaseAuth'
import { firebaseTransactionService } from './firebaseTransactions'
import { isDemoMode } from './firebase'

export const authService = isDemoMode ? demoAuthService : firebaseAuthService
export const transactionService = isDemoMode ? demoTransactionService : firebaseTransactionService
