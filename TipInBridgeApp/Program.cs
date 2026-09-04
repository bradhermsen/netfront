using System;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;
using Newtonsoft.Json.Linq;

namespace NetFrontBridgeApp
{
    public static class Program
    {
        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new TrayApplicationContext());
        }
    }

    public class AppSettings
    {
        public string GatewayIp { get; set; } = "192.168.68.66";
        public string AuthSecret { get; set; } = "NF-EMU-SECRET-2026";
        public bool ClockOnlyMode { get; set; } = false;

        private static readonly string configPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "NetFrontManager",
            "settings.json"
        );

        public static AppSettings Load()
        {
            try
            {
                if (File.Exists(configPath))
                {
                    string json = File.ReadAllText(configPath);
                    return Newtonsoft.Json.JsonConvert.DeserializeObject<AppSettings>(json) ?? new AppSettings();
                }
            }
            catch { }
            return new AppSettings();
        }

        public void Save()
        {
            try
            {
                string? dir = Path.GetDirectoryName(configPath);
                if (dir != null && !Directory.Exists(dir)) Directory.CreateDirectory(dir);
                string json = Newtonsoft.Json.JsonConvert.SerializeObject(this, Newtonsoft.Json.Formatting.Indented) ?? "{}";
                File.WriteAllText(configPath, json);
            }
            catch { }
        }
    }

    public class TrayApplicationContext : ApplicationContext
    {
        private readonly NotifyIcon trayIcon;
        private readonly ContextMenuStrip trayMenu;
        private readonly System.Windows.Forms.Timer backgroundPollTimer;
        private static readonly HttpClient client = new HttpClient() { Timeout = TimeSpan.FromSeconds(2) };

        private readonly AppSettings settings;
        private readonly ToolStripMenuItem toggleModeMenuItem;
        private readonly string jsonOutputPath;
        private bool isConnected = false;

        public TrayApplicationContext()
        {
            settings = AppSettings.Load();

            string localDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "NetFrontManager");
            if (!Directory.Exists(localDir)) Directory.CreateDirectory(localDir);
            jsonOutputPath = Path.Combine(localDir, "scoreboard.json");

            trayMenu = new ContextMenuStrip();
            trayMenu.Items.Add("Status: Connecting...", null, OnStatusClick);
            trayMenu.Items.Add(new ToolStripSeparator());

            toggleModeMenuItem = (ToolStripMenuItem)trayMenu.Items.Add(
                settings.ClockOnlyMode ? "Mode: Clock Only [Switch to Full]" : "Mode: Full State [Switch to Clock Only]",
                null,
                OnToggleModeClick
            );

            trayMenu.Items.Add("Configure Settings (IP & Token)...", null, OnConfigureClick);
            trayMenu.Items.Add(new ToolStripSeparator());
            trayMenu.Items.Add("Exit", null, OnExit);

            trayIcon = new NotifyIcon()
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath),
                ContextMenuStrip = trayMenu,
                Visible = true,
                Text = "TipIn Scoring Bridge"
            };

            backgroundPollTimer = new System.Windows.Forms.Timer();
            backgroundPollTimer.Interval = 1000;
            backgroundPollTimer.Tick += async (sender, e) => await PollScoreboardState();
            backgroundPollTimer.Start();
        }

        private string GetBaseUrl() => $"http://{settings.GatewayIp}";

        private async Task PollScoreboardState()
        {
            try
            {
                string endpoint = settings.ClockOnlyMode ? "/api/state/clock" : "/api/state/full";
                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"{GetBaseUrl()}{endpoint}");
                if (!string.IsNullOrEmpty(settings.AuthSecret))
                    request.Headers.Add("Authorization", $"Bearer {settings.AuthSecret}");

                HttpResponseMessage response = await client.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    isConnected = true;
                    string jsonResponse = await response.Content.ReadAsStringAsync();
                    string vmixJsonFormat = "[" + jsonResponse + "]";
                    File.WriteAllText(jsonOutputPath, vmixJsonFormat);

                    JObject data = JObject.Parse(jsonResponse);
                    string clock = data["clock"]?.ToString() ?? "00:00";
                    string homeScore = data["homeScore"]?.ToString() ?? "0";
                    string awayScore = data["awayScore"]?.ToString() ?? "0";
                    string period = data["period"]?.ToString() ?? "1";

                    trayIcon.Text = settings.ClockOnlyMode
                        ? $"TipIn Clock: {clock}"
                        : $"TipIn: {homeScore}-{awayScore} P{period} ({clock})";

                    trayMenu.Items[0].Text = $"Status: Connected ({settings.GatewayIp})";
                }
                else
                {
                    isConnected = false;
                    trayMenu.Items[0].Text = "Status: Disconnected";
                    trayIcon.Text = "TipIn: Disconnected";
                }
            }
            catch
            {
                isConnected = false;
                trayMenu.Items[0].Text = "Status: Disconnected";
                trayIcon.Text = "TipIn: Disconnected";
            }
        }

        private void OnToggleModeClick(object? sender, EventArgs e)
        {
            settings.ClockOnlyMode = !settings.ClockOnlyMode;
            settings.Save();

            toggleModeMenuItem.Text = settings.ClockOnlyMode
                ? "Mode: Clock Only [Switch to Full]"
                : "Mode: Full State [Switch to Clock Only]";

            MessageBox.Show($"Switched data view to: {(settings.ClockOnlyMode ? "Clock Only" : "Full State")}", "Mode Updated");
        }

        private void OnConfigureClick(object? sender, EventArgs e)
        {
            using (var prompt = new Form())
            {
                prompt.Width = 340;
                prompt.Height = 220;
                prompt.FormBorderStyle = FormBorderStyle.FixedDialog;
                prompt.Text = "TipIn Scoring Bridge Configuration";
                prompt.StartPosition = FormStartPosition.CenterScreen;
                prompt.MaximizeBox = false;
                prompt.MinimizeBox = false;

                var lblIp = new Label() { Left = 20, Top = 15, Text = "Gateway IP Address:", Width = 280 };
                var txtIp = new TextBox() { Left = 20, Top = 35, Width = 280, Text = settings.GatewayIp };

                var lblToken = new Label() { Left = 20, Top = 70, Text = "Security / Auth Token:", Width = 280 };
                var txtToken = new TextBox() { Left = 20, Top = 90, Width = 280, Text = settings.AuthSecret };

                var btnSave = new Button() { Text = "Save", Left = 220, Width = 80, Top = 135, DialogResult = DialogResult.OK };
                btnSave.Click += (s, ev) => { prompt.Close(); };

                prompt.Controls.Add(lblIp);
                prompt.Controls.Add(txtIp);
                prompt.Controls.Add(lblToken);
                prompt.Controls.Add(txtToken);
                prompt.Controls.Add(btnSave);
                prompt.AcceptButton = btnSave;

                if (prompt.ShowDialog() == DialogResult.OK)
                {
                    settings.GatewayIp = txtIp.Text.Trim();
                    settings.AuthSecret = txtToken.Text.Trim();
                    settings.Save();
                    MessageBox.Show("Configuration updated successfully.", "Saved", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        private void OnStatusClick(object? sender, EventArgs e)
        {
            string mode = settings.ClockOnlyMode ? "Clock Only" : "Full State";
            string vmixUrl = $"file:///{jsonOutputPath.Replace("\\", "/")}";

            MessageBox.Show(
                $"Gateway: {settings.GatewayIp}\nMode: {mode}\nConnected: {isConnected}\n\nvMix JSON File:\n{vmixUrl}",
                "TipIn Scoring Bridge Status",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }

        private void OnExit(object? sender, EventArgs e)
        {
            backgroundPollTimer?.Stop();
            trayIcon.Visible = false;
            Application.Exit();
        }
    }
}
