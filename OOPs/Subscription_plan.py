from datetime import datetime

# 1. ABSTRACTION: We create a simple blueprint. 
# The user doesn't need to know how dates are calculated; they just call a method.
class Subscription:
    def __init__(self, name, cost, category):
        # 2. ENCAPSULATION: We bundle data (attributes) and behavior (methods) inside one object.
        self.name = name
        self.cost = cost
        self.category = category
        self._is_active = True  # Prefixed with '_' to show it is protected/internal

    def get_monthly_cost(self):
        # Base method to be overridden
        return self.cost

    def cancel_service(self):
        self._is_active = False
        print(f"Canceled {self.name}. You saved money!")

# 3. INHERITANCE: YearlySubscription inherits everything from Subscription, but adds unique features.
class YearlySubscription(Subscription):
    def __init__(self, name, cost, category, renewal_month):
        super().__init__(name, cost, category) # Calls the parent constructor
        self.renewal_month = renewal_month

    # 4. POLYMORPHISM: Same method name as the parent, but works differently for yearly billing.
    def get_monthly_cost(self):
        return self.cost / 12

# 5. OBJECT INTERACTION: A manager class that holds and controls our objects.
class SubscriptionManager:
    def __init__(self):
        self.subscriptions = []

    def add_subscription(self, sub):
        self.subscriptions.append(sub)

    def calculate_total_monthly_burn(self):
        # Polymorphism in action: Python automatically knows which formula to use!
        total = sum(sub.get_monthly_cost() for sub in self.subscriptions if sub._is_active)
        return round(total, 2)

# --- RUNNING THE CODE ---
# Creating actual instances (objects) from our classes
netflix = Subscription("Netflix", 15.00, "Entertainment")
creative_cloud = YearlySubscription("Adobe CC", 600.00, "Work", "December")

# Managing them
my_wallet = SubscriptionManager()
my_wallet.add_subscription(netflix)
my_wallet.add_subscription(creative_cloud)

print(f"Total monthly cost: ${my_wallet.calculate_total_monthly_burn()}")
# Output will correctly compute $15 (Netflix) + $50 (Adobe yearly broken down to monthly) = $65
