import random

# 1. CLASS DEFINITION
class BankAccount:
    def __init__(self, owner_name, initial_deposit):
        self.owner_name = owner_name
        self.account_number = random.randint(10000, 99999)
        # 2. ENCAPSULATION: The double underscore makes 'balance' private.
        # It cannot be accessed or changed directly from outside the class.
        self.__balance = initial_deposit 

    # Encapsulation: Safe way to add money
    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
            print(f"💰 Deposited ₹{amount}. New Balance: ₹{self.__balance}")
        else:
            print("❌ Invalid deposit amount!")

    # Encapsulation: Safe way to take out money with checks
    def withdraw(self, amount):
        if 0 < amount <= self.__balance:
            self.__balance -= amount
            print(f"💸 Withdrew ₹{amount}. Remaining Balance: ₹{self.__balance}")
            return True
        else:
            print("❌ Transaction Declined: Insufficient funds or invalid amount.")
            return False

    # Encapsulation: Getter method to safely read the private balance
    def get_balance(self):
        return self.__balance

    # This method will be overridden by child classes (Polymorphism)
    def print_statement(self):
        print(f"\n--- Standard Account Statement ---")
        print(f"Holder: {self.owner_name} | Acc No: {self.account_number}")
        print(f"Current Balance: ₹{self.__balance}")


# 3. INHERITANCE: SavingsAccount gets all features of BankAccount
class SavingsAccount(BankAccount):
    def __init__(self, owner_name, initial_deposit, interest_rate=0.04):
        # Call the parent class constructor to set up name and balance
        super().__init__(owner_name, initial_deposit)
        self.interest_rate = interest_rate

    def apply_interest(self):
        # Calculate interest using the safe getter method from parent
        interest = self.get_balance() * self.interest_rate
        self.deposit(interest)
        print(f"📈 Interest of ₹{interest} applied at {self.interest_rate*100}%!")

    # 4. POLYMORPHISM: Customizing the statement display specifically for Savings
    def print_statement(self):
        print(f"\n--- 🌟 Savings Account Statement 🌟 ---")
        print(f"Holder: {self.owner_name} | Acc No: {self.account_number}")
        print(f"Balance: ₹{self.get_balance()} | Interest Rate: {self.interest_rate*100}%")


# --- PRACTICAL EXECUTION ---

print("=== CREATING ACCOUNTS ===")
# Creating unique objects (Instances)
rahul_acc = BankAccount("Rahul Sharma", 5000)
priya_acc = SavingsAccount("Priya Patel", 10000)

print("\n=== TESTING ENCAPSULATION ===")
rahul_acc.deposit(2000)
rahul_acc.withdraw(1500)
# TRYING TO HACK: The line below will fail to change the actual balance because it is encapsulated!
rahul_acc.__balance = 1000000 

print("\n=== TESTING INHERITANCE & SPECIAL FUNCTIONS ===")
# Priya's account can do everything Rahul's can, plus apply interest
priya_acc.deposit(5000)
priya_acc.apply_interest()

print("\n=== TESTING POLYMORPHISM ===")
# We put different types of accounts in a single list
all_accounts = [rahul_acc, priya_acc]

# We run the exact same method name on both, but they output different layouts!
for acc in all_accounts:
    acc.print_statement()
