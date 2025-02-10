using System.Windows;

namespace BillingSoftware
{
    public partial class MainWindow : Window
    {
        private bool isQuickMenuVisible = false; // Track menu visibility

        public MainWindow()
        {
            InitializeComponent();
        }

        // Toggle Quick Menu
        private void ToggleQuickMenu(object sender, RoutedEventArgs e)
        {
            isQuickMenuVisible = !isQuickMenuVisible;
            QuickMenuPanel.Visibility = isQuickMenuVisible ? Visibility.Visible : Visibility.Collapsed;
        }

        // Quick Menu Button Click Events
        private void POSBilling_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("POS Billing Clicked");
        }

        private void PreviousBill_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Previous Bill Clicked");
        }

        private void ItemSummary_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Item Summary Clicked");
        }

        private void PaymentHistory_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Payment History Clicked");
        }

        private void Order_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show("Order Clicked");
        }
    }
}
