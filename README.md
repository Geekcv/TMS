<Window x:Class="BillingSoftware.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Billing System" Height="600" Width="900">
    
    <Grid>
        <!-- Top Menu Bar -->
        <Menu Background="Blue" Height="40">
            <MenuItem Header="Quick Menu"/>
            <MenuItem Header="Invoice"/>
            <MenuItem Header="Price List"/>
            <MenuItem Header="Sale Order"/>
            <MenuItem Header="Inventory"/>
            <MenuItem Header="Checker"/>
            <MenuItem Header="Licensing"/>
            <MenuItem Header="Reports"/>
            <MenuItem Header="Barcode Generator"/>
        </Menu>

        <!-- Main Layout -->
        <Grid Margin="10,50,10,10">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="2*" />
                <ColumnDefinition Width="1*" />
            </Grid.ColumnDefinitions>

            <!-- Left Section (Bill Details) -->
            <Border Grid.Column="0" BorderBrush="Black" BorderThickness="1" Padding="10">
                <StackPanel>
                    <!-- Filters -->
                    <StackPanel Orientation="Horizontal" Margin="0,0,0,10">
                        <Label Content="Date:"/>
                        <DatePicker Width="120" SelectedDate="{x:Static sys:DateTime.Now}" />
                        <Label Content="Invoice No:" Margin="10,0,0,0"/>
                        <TextBox Width="120"/>
                        <Button Content="🔍" Width="30" />
                    </StackPanel>

                    <!-- Data Grid -->
                    <DataGrid Name="BillsDataGrid" AutoGenerateColumns="False" Height="300">
                        <DataGrid.Columns>
                            <DataGridTextColumn Header="Date" Binding="{Binding Date}" Width="Auto"/>
                            <DataGridTextColumn Header="Time" Binding="{Binding Time}" Width="Auto"/>
                            <DataGridTextColumn Header="Serial No." Binding="{Binding SerialNo}" Width="Auto"/>
                            <DataGridTextColumn Header="Mobile No." Binding="{Binding MobileNo}" Width="Auto"/>
                            <DataGridTextColumn Header="Amount" Binding="{Binding Amount}" Width="Auto"/>
                        </DataGrid.Columns>
                    </DataGrid>

                    <!-- Action Buttons -->
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
