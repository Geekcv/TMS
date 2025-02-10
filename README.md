<Window x:Class="BillingSoftware.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Billing System" Height="600" Width="900">

    <Grid>
        <!-- Main Menu Bar -->
        <StackPanel Orientation="Horizontal" Background="Blue" Height="40">
            <Button Content="Quick Menu" Foreground="White" Background="Transparent" Click="ToggleQuickMenu"/>
            <Button Content="Invoice" Foreground="White" Background="Transparent"/>
            <Button Content="Price List" Foreground="White" Background="Transparent"/>
            <Button Content="Sale Order" Foreground="White" Background="Transparent"/>
            <Button Content="Inventory" Foreground="White" Background="Transparent"/>
            <Button Content="Checker" Foreground="White" Background="Transparent"/>
            <Button Content="Licensing" Foreground="White" Background="Transparent"/>
            <Button Content="Reports" Foreground="White" Background="Transparent"/>
            <Button Content="Barcode Generator" Foreground="White" Background="Transparent"/>
        </StackPanel>

        <!-- Quick Menu Options -->
        <StackPanel Name="QuickMenuPanel" Background="LightGray" Width="150" Visibility="Collapsed" VerticalAlignment="Top" Margin="10,50,0,0">
            <Button Content="POS Billing" Click="POSBilling_Click"/>
            <Button Content="Previous Bill" Click="PreviousBill_Click"/>
            <Button Content="Item Summary" Click="ItemSummary_Click"/>
            <Button Content="Payment History" Click="PaymentHistory_Click"/>
            <Button Content="Order" Click="Order_Click"/>
        </StackPanel>

        <!-- Rest of the UI Layout -->
        <Grid Margin="10,90,10,10">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="2*" />
                <ColumnDefinition Width="1*" />
            </Grid.ColumnDefinitions>

            <!-- Left Section (Bill Details) -->
            <Border Grid.Column="0" BorderBrush="Black" BorderThickness="1" Padding="10">
                <StackPanel>
                    <StackPanel Orientation="Horizontal" Margin="0,0,0,10">
                        <Label Content="Date:"/>
                        <DatePicker Width="120" />
                        <Label Content="Invoice No:" Margin="10,0,0,0"/>
                        <TextBox Width="120"/>
                        <Button Content="🔍" Width="30" />
                    </StackPanel>

                    <DataGrid Name="BillsDataGrid" AutoGenerateColumns="False" Height="300">
                        <DataGrid.Columns>
                            <DataGridTextColumn Header="Date" Binding="{Binding Date}" Width="Auto"/>
                            <DataGridTextColumn Header="Time" Binding="{Binding Time}" Width="Auto"/>
                            <DataGridTextColumn Header="Serial No." Binding="{Binding SerialNo}" Width="Auto"/>
                            <DataGridTextColumn Header="Mobile No." Binding="{Binding MobileNo}" Width="Auto"/>
                            <DataGridTextColumn Header="Amount" Binding="{Binding Amount}" Width="Auto"/>
                        </DataGrid.Columns>
                    </DataGrid>

                    <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" Margin="10">
                        <Button Content="Edit" Width="80" Background="Orange"/>
                        <Button Content="Exit" Width="80" Margin="10,0,10,0"/>
                        <Button Content="Delete Bill" Width="100" Background="Red"/>
                        <Button Content="Print Receipt" Width="120" Background="Yellow"/>
                    </StackPanel>
                </StackPanel>
            </Border>

            <!-- Right Section (Company Info) -->
            <Border Grid.Column="1" BorderBrush="Black" BorderThickness="1" Padding="10" Background="White">
                <StackPanel HorizontalAlignment="Center">
                    <TextBlock Text="Fintech IT Solutions LLP" FontSize="16" FontWeight="Bold" TextAlignment="Center"/>
                    <TextBlock Text="STPI, Cyber Park, HIA, Basni, Jodhpur (Rajasthan)" TextAlignment="Center"/>
                    <TextBlock Text="Mobile Number    Email Address" TextAlignment="Center"/>
                    <TextBlock Text="GSTIN: " TextAlignment="Center"/>
                </StackPanel>
            </Border>
        </Grid>
    </Grid>
</Window>
