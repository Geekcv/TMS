dotnet add package Npgsql

using System;
using System.Data;
using Npgsql;

namespace BillingSoftware.Helpers
{
    public class DatabaseHelper
    {
        private readonly string _connectionString = "Host=localhost;Port=5432;Database=BillingDB;Username=postgres;Password=yourpassword";

        public NpgsqlConnection GetConnection()
        {
            return new NpgsqlConnection(_connectionString);
        }

        public DataTable ExecuteQuery(string query)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(query, conn))
                {
                    using (var adapter = new NpgsqlDataAdapter(cmd))
                    {
                        DataTable dt = new DataTable();
                        adapter.Fill(dt);
                        return dt;
                    }
                }
            }
        }

        public int ExecuteNonQuery(string query)
        {
            using (var conn = GetConnection())
            {
                conn.Open();
                using (var cmd = new NpgsqlCommand(query, conn))
                {
                    return cmd.ExecuteNonQuery();
                }
            }
        }
    }
}

CREATE TABLE Products (
    ProductId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL
);

CREATE TABLE Customers (
    CustomerId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL
);

CREATE TABLE Invoices (
    InvoiceId SERIAL PRIMARY KEY,
    CustomerId INT REFERENCES Customers(CustomerId),
    InvoiceDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount DECIMAL(10,2) NOT NULL
);

public void AddProduct(string name, decimal price, int stock)
{
    string query = $"INSERT INTO Products (Name, Price, Stock) VALUES ('{name}', {price}, {stock})";
    DatabaseHelper db = new DatabaseHelper();
    db.ExecuteNonQuery(query);
}

public DataTable GetProducts()
{
    string query = "SELECT * FROM Products";
    DatabaseHelper db = new DatabaseHelper();
    return db.ExecuteQuery(query);
}

public void UpdateProduct(int productId, string name, decimal price, int stock)
{
    string query = $"UPDATE Products SET Name = '{name}', Price = {price}, Stock = {stock} WHERE ProductId = {productId}";
    DatabaseHelper db = new DatabaseHelper();
    db.ExecuteNonQuery(query);
}


public void DeleteProduct(int productId)
{
    string query = $"DELETE FROM Products WHERE ProductId = {productId}";
    DatabaseHelper db = new DatabaseHelper();
    db.ExecuteNonQuery(query);
}


<Window x:Class="BillingSoftware.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Billing Software" Height="450" Width="700">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <!-- Product Form -->
        <StackPanel Orientation="Horizontal" Margin="10">
            <TextBox x:Name="txtName" Width="150" PlaceholderText="Product Name" Margin="5"/>
            <TextBox x:Name="txtPrice" Width="100" PlaceholderText="Price" Margin="5"/>
            <TextBox x:Name="txtStock" Width="80" PlaceholderText="Stock" Margin="5"/>
            <Button Content="Add Product" Width="100" Click="AddProduct_Click" Margin="5"/>
            <Button Content="Update" Width="80" Click="UpdateProduct_Click" Margin="5"/>
            <Button Content="Delete" Width="80" Click="DeleteProduct_Click" Margin="5"/>
        </StackPanel>

        <!-- Product List -->
        <DataGrid x:Name="dgProducts" Grid.Row="1" AutoGenerateColumns="True" SelectionChanged="dgProducts_SelectionChanged" Margin="10"/>
    </Grid>
</Window>


using System;
using System.Data;
using System.Windows;
using BillingSoftware.Helpers;

namespace BillingSoftware
{
    public partial class MainWindow : Window
    {
        private DatabaseHelper db;
        private int selectedProductId = -1;

        public MainWindow()
        {
            InitializeComponent();
            db = new DatabaseHelper();
            LoadProducts();
        }

        private void LoadProducts()
        {
            dgProducts.ItemsSource = db.ExecuteQuery("SELECT * FROM Products").DefaultView;
        }

        private void AddProduct_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtName.Text) || string.IsNullOrWhiteSpace(txtPrice.Text) || string.IsNullOrWhiteSpace(txtStock.Text))
            {
                MessageBox.Show("Please fill all fields.", "Warning", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            string name = txtName.Text;
            decimal price = Convert.ToDecimal(txtPrice.Text);
            int stock = Convert.ToInt32(txtStock.Text);

            string query = $"INSERT INTO Products (Name, Price, Stock) VALUES ('{name}', {price}, {stock})";
            db.ExecuteNonQuery(query);
            LoadProducts();
            ClearFields();
        }

        private void UpdateProduct_Click(object sender, RoutedEventArgs e)
        {
            if (selectedProductId == -1)
            {
                MessageBox.Show("Select a product to update.", "Warning", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            string name = txtName.Text;
            decimal price = Convert.ToDecimal(txtPrice.Text);
            int stock = Convert.ToInt32(txtStock.Text);

            string query = $"UPDATE Products SET Name = '{name}', Price = {price}, Stock = {stock} WHERE ProductId = {selectedProductId}";
            db.ExecuteNonQuery(query);
            LoadProducts();
            ClearFields();
        }

        private void DeleteProduct_Click(object sender, RoutedEventArgs e)
        {
            if (selectedProductId == -1)
            {
                MessageBox.Show("Select a product to delete.", "Warning", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            string query = $"DELETE FROM Products WHERE ProductId = {selectedProductId}";
            db.ExecuteNonQuery(query);
            LoadProducts();
            ClearFields();
        }

        private void dgProducts_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (dgProducts.SelectedItem is DataRowView row)
            {
                selectedProductId = Convert.ToInt32(row["ProductId"]);
                txtName.Text = row["Name"].ToString();
                txtPrice.Text = row["Price"].ToString();
                txtStock.Text = row["Stock"].ToString();
            }
        }

        private void ClearFields()
        {
            txtName.Text = "";
            txtPrice.Text = "";
            txtStock.Text = "";
            selectedProductId = -1;
        }
    }
}



