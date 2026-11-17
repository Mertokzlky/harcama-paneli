import { demoAuthService, demoBudgetService, demoTransactionService } from './demo'
import { firebaseAuthService } from './firebaseAuth'
import { firebaseBudgetService } from './firebaseBudgets'
import { firebaseTransactionService } from './firebaseTransactions'
import { isDemoMode } from './firebase'

export const authService = isDemoMode ? demoAuthService : firebaseAuthService
export const transactionService = isDemoMode ? demoTransactionService : firebaseTransactionService
export const budgetService = isDemoMode ? demoBudgetService : firebaseBudgetService
