<Window x:Class="BillingSoftware.SalesInvoice"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Sales Invoice"
        Height="800" Width="1200"
        WindowStartupLocation="CenterScreen"
        Background="LightGray">
    
    <Grid Margin="10">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <!-- Top Navigation Bar -->
        <DockPanel Background="RoyalBlue" Height="40">
            <TextBlock Text="Quick Menu" Foreground="White" FontSize="14" FontWeight="Bold" Margin="10,0,20,0"/>
            <Button Content="Invoice" Style="{StaticResource NavButton}" />
            <Button Content="Price List" Style="{StaticResource NavButton}" />
            <Button Content="Sale Order" Style="{StaticResource NavButton}" />
            <Button Content="Inventory" Style="{StaticResource NavButton}" />
            <Button Content="Checker" Style="{StaticResource NavButton}" />
            <Button Content="Licensing" Style="{StaticResource NavButton}" />
            <Button Content="Reports" Style="{StaticResource NavButton}" />
            <Button Content="Barcode Generator" Style="{StaticResource NavButton}" />
        </DockPanel>

        <!-- Main Content -->
        <Grid Grid.Row="1">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="2*"/>
                <ColumnDefinition Width="1.5*"/>
            </Grid.ColumnDefinitions>

            <!-- Left Side - Invoice Details -->
            <Border Grid.Column="0" Background="White" Padding="15" Margin="10" BorderBrush="Gray" BorderThickness="1">
                <StackPanel>
                    <TextBlock Text="Sales Bill" FontSize="18" FontWeight="Bold" Foreground="RoyalBlue" Margin="0,0,0,10"/>

                    <Grid>
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="Auto"/>
                            <ColumnDefinition Width="*"/>
                            <ColumnDefinition Width="Auto"/>
                            <ColumnDefinition Width="*"/>
                        </Grid.ColumnDefinitions>

                        <!-- Order Details -->
                        <TextBlock Text="Order No. :" FontWeight="Bold"/>
                        <TextBlock Text="898465" Grid.Column="1"/>
                        <TextBlock Text="Order Date :" FontWeight="Bold" Grid.Column="2"/>
                        <TextBlock Text="06/02/2025" Grid.Column="3"/>

                        <TextBlock Text="Shipping To :" FontWeight="Bold" Grid.Row="1"/>
                        <TextBlock Text="Balaji General Store Jodhpur" Grid.Row="1" Grid.Column="1"/>

                        <TextBlock Text="Mobile Number :" FontWeight="Bold" Grid.Row="2"/>
                        <TextBox Text="7878454455" Grid.Row="2" Grid.Column="1"/>

                        <TextBlock Text="Email :" FontWeight="Bold" Grid.Row="3"/>
                        <TextBox Text="balajigeneralstorejodhpur@gmail.com" Grid.Row="3" Grid.Column="1"/>

                        <TextBlock Text="Address :" FontWeight="Bold" Grid.Row="4"/>
                        <TextBox Text="Plot No. 102, Balaji General Store, Jodhpur" Grid.Row="4" Grid.Column="1" TextWrapping="Wrap" Height="40"/>
                    </Grid>

                    <!-- Data Grid for Items -->
                    <DataGrid Name="dgInvoiceItems" AutoGenerateColumns="False" HeadersVisibility="Column"
                              CanUserAddRows="True" Margin="0,15,0,0">
                        <DataGrid.Columns>
                            <DataGridTextColumn Header="S No." Binding="{Binding SerialNo}" Width="50"/>
                            <DataGridTextColumn Header="Code" Binding="{Binding ItemCode}" Width="80"/>
                            <DataGridTextColumn Header="Item Name" Binding="{Binding ItemName}" Width="150"/>
                            <DataGridTextColumn Header="Qty." Binding="{Binding Quantity}" Width="50"/>
                            <DataGridTextColumn Header="Kg" Binding="{Binding Weight}" Width="80"/>
                            <DataGridTextColumn Header="Price" Binding="{Binding Price}" Width="80"/>
                            <DataGridTextColumn Header="Total" Binding="{Binding Total}" Width="100"/>
                            <DataGridTextColumn Header="Status" Binding="{Binding Status}" Width="100"/>
                        </DataGrid.Columns>
                    </DataGrid>

                    <!-- Bottom Controls -->
                    <StackPanel Orientation="Horizontal" Margin="0,10,0,0">
                        <Button Content="Add" Width="80"/>
                        <Button Content="Remove" Width="80" Margin="10,0,0,0"/>
                    </StackPanel>

                    <Grid Margin="0,10,0,0">
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*" />
                            <ColumnDefinition Width="Auto" />
                        </Grid.ColumnDefinitions>

                        <TextBlock Text="Grand Total:" FontSize="16" FontWeight="Bold"/>
                        <TextBlock Text="₹37,542.59" Grid.Column="1" FontSize="16" FontWeight="Bold" Foreground="Green"/>
                    </Grid>

                    <!-- Action Buttons -->
                    <StackPanel Orientation="Horizontal" HorizontalAlignment="Right" Margin="0,20,0,0">
                        <Button Content="Exit" Width="80" Background="Gray" Foreground="White"/>
                        <Button Content="Save" Width="80" Background="Blue" Foreground="White" Margin="10,0,0,0"/>
                        <Button Content="Print Receipt" Width="120" Background="Orange" Foreground="White" Margin="10,0,0,0"/>
                        <Button Content="Place Order" Width="120" Background="Red" Foreground="White" Margin="10,0,0,0"/>
                    </StackPanel>
                </StackPanel>
            </Border>

            <!-- Right Side - Company Info -->
            <Border Grid.Column="1" Background="White" Padding="15" Margin="10" BorderBrush="Gray" BorderThickness="1">
                <StackPanel>
                    <TextBlock Text="Fintech IT Solutions LLP" FontSize="16" FontWeight="Bold" Foreground="RoyalBlue"/>
                    <TextBlock Text="STPI, Cyb-1, Cyber Park, Jodhpur" FontSize="14"/>
                    <TextBlock Text="Mobile Number: " FontSize="14"/>
                    <TextBlock Text="Email Address: " FontSize="14"/>
                    <TextBlock Text="GSTIN: " FontSize="14"/>
                </StackPanel>
            </Border>
        </Grid>
    </Grid>
</Window>
