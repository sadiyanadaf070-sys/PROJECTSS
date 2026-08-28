import tkinter as tk
from tkinter import messagebox

# ==========================================
# 1. OOP PROCESSING LAYER (The Back-End)
# ==========================================
class Subscription:
    """This class encapsulates all data for a single subscription."""
    def __init__(self, name, cost):
        self.name = name
        self.cost = float(cost) # Converts raw text input into a decimal number

class SubscriptionManager:
    """This class manages the list of objects and performs calculations."""
    def __init__(self):
        self.all_subscriptions = [] # List to hold our Subscription objects

    def add_new_sub(self, name, cost):
        # Create a new Object from the Subscription class
        new_item = Subscription(name, cost)
        # Store the object in our list
        self.all_subscriptions.append(new_item)

    def get_total_burn_rate(self):
        # Loop through all objects and add up their costs
        total = sum(sub.cost for sub in self.all_subscriptions)
        return total


# ==========================================
# 2. FRONT-END LAYER (The User Interface)
# ==========================================
class AppWindow:
    def __init__(self, root):
        self.root = root
        self.root.title("OOP Tracker")
        self.root.geometry("300x250")
        
        # Connect the UI to the OOP Processing Engine
        self.manager = SubscriptionManager()

        # UI Element: Name Input
        tk.Label(root, text="Service Name:").pack(pady=2)
        self.name_input = tk.Entry(root)
        self.name_input.pack(pady=2)

        # UI Element: Cost Input
        tk.Label(root, text="Monthly Cost (₹):").pack(pady=2)
        self.cost_input = tk.Entry(root)
        self.cost_input.pack(pady=2)

        # UI Element: Submit Button
        self.submit_btn = tk.Button(root, text="Add Subscription", command=self.handle_button_click)
        self.submit_btn.pack(pady=10)

        # UI Element: Total Display Label
        self.total_label = tk.Label(root, text="Total Expenses: ₹0.0", font=("Arial", 12, "bold"))
        self.total_label.pack(pady=10)

    def handle_button_click(self):
        """This function bridges the UI data to the OOP processing logic."""
        # Step 1: Grab raw text data from entry boxes
        raw_name = self.name_input.get()
        raw_cost = self.cost_input.get()

        # Basic Validation Check
        if not raw_name or not raw_cost:
            messagebox.showerror("Error", "Please fill in all fields!")
            return

        try:
            # Step 2: Send raw data to the OOP Manager to process and build objects
            self.manager.add_new_sub(raw_name, raw_cost)

            # Step 3: Tell the OOP Manager to recalculate the total
            new_total = self.manager.get_total_burn_rate()

            # Step 4: Update the Front-End screen with the new calculation
            self.total_label.config(text=f"Total Expenses: ₹{new_total:.2f}")

            # Clear entry boxes for the next input
            self.name_input.delete(0, tk.END)
            self.cost_input.delete(0, tk.END)

        except ValueError:
            messagebox.showerror("Error", "Please enter a valid number for Cost!")

# --- RUNNING THE ENTIRE APP ---
if __name__ == "__main__":
    window = tk.Tk()
    app = AppWindow(window)
    window.mainloop()
