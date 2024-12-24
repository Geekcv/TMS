<Window x:Class="NodeCommandApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Node.js Command App" Height="300" Width="400">
    <Grid>
        <!-- Start/Stop Button -->
        <Button x:Name="StartStopButton" Content="Start Node.js" Width="120" Height="40" HorizontalAlignment="Center" VerticalAlignment="Center" Click="StartStopButton_Click"/>
        
        <!-- Status Indicator -->
        <Ellipse x:Name="StatusIndicator" Width="20" Height="20" HorizontalAlignment="Center" VerticalAlignment="Top" Fill="Red" Margin="0,20,0,0"/>

        <!-- Minimize to Arrow Icon Button -->
        <Button x:Name="MinimizeButton" Content="➤" Width="40" Height="40" HorizontalAlignment="Right" VerticalAlignment="Bottom" Click="MinimizeButton_Click"/>
    </Grid>
</Window>




using System;
using System.Diagnostics;
using System.Windows;
using System.Windows.Media;

namespace NodeCommandApp
{
    public partial class MainWindow : Window
    {
        private Process _nodeProcess;
        private bool _isRunning = false;

        public MainWindow()
        {
            InitializeComponent();
        }

        // Start/Stop Node.js Process
        private void StartStopButton_Click(object sender, RoutedEventArgs e)
        {
            if (!_isRunning)
            {
                try
                {
                    _nodeProcess = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = "cmd.exe",
                            Arguments = "/c start-node.bat", // Batch file to start Node.js
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            RedirectStandardOutput = true,
                            RedirectStandardError = true
                        }
                    };
                    _nodeProcess.Start();
                    _isRunning = true;
                    UpdateStatus(true);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error starting process: {ex.Message}");
                }
            }
            else
            {
                try
                {
                    _nodeProcess.Kill();
                    _nodeProcess.Dispose();
                    _isRunning = false;
                    UpdateStatus(false);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Error stopping process: {ex.Message}");
                }
            }
        }

        // Update Status Indicator
        private void UpdateStatus(bool isRunning)
        {
            StatusIndicator.Fill = isRunning ? Brushes.Green : Brushes.Red;
            StartStopButton.Content = isRunning ? "Stop Node.js" : "Start Node.js";
        }

        // Minimize to Arrow Icon
        private void MinimizeButton_Click(object sender, RoutedEventArgs e)
        {
            this.Width = 50;
            this.Height = 50;
            MinimizeButton.Visibility = Visibility.Collapsed;
        }
    }
}




<Window x:Class="NodeCommandApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Node.js Command App" Height="300" Width="400">
    <Grid>
        <!-- Start/Stop Button -->
        <Button x:Name="StartStopButton" Content="Start Node.js" Width="120" Height="40" HorizontalAlignment="Center" VerticalAlignment="Center" Click="StartStopButton_Click"/>
        
        <!-- Status Indicator -->
        <Ellipse x:Name="StatusIndicator" Width="20" Height="20" HorizontalAlignment="Center" VerticalAlignment="Top" Fill="Red" Margin="0,20,0,0"/>

        <!-- Minimize to Arrow Icon Button -->
        <Button x:Name="MinimizeButton" Content="➤" Width="40" Height="40" HorizontalAlignment="Right" VerticalAlignment="Bottom" Click="MinimizeButton_Click"/>
    </Grid>
</Window>
