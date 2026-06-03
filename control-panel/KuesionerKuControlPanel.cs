using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.ServiceProcess;
using System.Text;
using System.Windows.Forms;

namespace KuesionerKuControlPanel
{
    internal static class Ui
    {
        public static readonly Color App = Color.FromArgb(244, 248, 251);
        public static readonly Color Surface = Color.White;
        public static readonly Color SurfaceSoft = Color.FromArgb(248, 251, 253);
        public static readonly Color Border = Color.FromArgb(215, 227, 235);
        public static readonly Color Primary = Color.FromArgb(12, 192, 223);
        public static readonly Color PrimaryDark = Color.FromArgb(8, 131, 160);
        public static readonly Color PrimarySoft = Color.FromArgb(232, 250, 254);
        public static readonly Color PrimaryLine = Color.FromArgb(129, 220, 236);
        public static readonly Color Text = Color.FromArgb(15, 23, 42);
        public static readonly Color Muted = Color.FromArgb(100, 116, 139);
        public static readonly Color MutedLight = Color.FromArgb(148, 163, 184);
        public static readonly Color Warning = Color.FromArgb(180, 83, 9);
        public static readonly Color WarningSoft = Color.FromArgb(255, 248, 237);
        public static readonly Color WarningLine = Color.FromArgb(254, 215, 170);
        public static readonly Color Danger = Color.FromArgb(217, 45, 32);
        public static readonly Color DangerSoft = Color.FromArgb(255, 243, 241);
        public static readonly Color DangerLine = Color.FromArgb(255, 208, 202);
        public static readonly Color Success = Color.FromArgb(6, 118, 71);
        public static readonly Color SuccessSoft = Color.FromArgb(236, 253, 243);
        public static readonly Color SuccessLine = Color.FromArgb(187, 247, 208);
        public static readonly Color Disabled = Color.FromArgb(241, 245, 249);
        public static readonly Color DisabledText = Color.FromArgb(148, 163, 184);
        public static readonly Color LogBack = Color.FromArgb(248, 251, 253);

        public static GraphicsPath RoundedRect(Rectangle bounds, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int diameter = Math.Max(0, radius) * 2;
            if (diameter <= 0)
            {
                path.AddRectangle(bounds);
                return path;
            }

            Rectangle arc = new Rectangle(bounds.Location, new Size(diameter, diameter));
            path.AddArc(arc, 180, 90);
            arc.X = bounds.Right - diameter;
            path.AddArc(arc, 270, 90);
            arc.Y = bounds.Bottom - diameter;
            path.AddArc(arc, 0, 90);
            arc.X = bounds.Left;
            path.AddArc(arc, 90, 90);
            path.CloseFigure();
            return path;
        }
    }

    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form
    {
        private const string AppName = "KUNEKU";
        private const string OwnerName = "Muhammad Habib Rafi";

        private readonly string rootDir;
        private readonly string logsDir;
        private readonly ServiceView dashboard;
        private readonly ServiceView gateway;
        private readonly ServiceView mysql;
        private readonly TextBox logBox;
        private readonly Timer timer;

        public MainForm()
        {
            rootDir = ResolveRoot();
            logsDir = Path.Combine(rootDir, "logs");

            Text = AppName + " Control Center";
            TryApplyWindowIcon();
            StartPosition = FormStartPosition.CenterScreen;
            MinimumSize = new Size(1120, 700);
            Size = new Size(1280, 720);
            BackColor = Ui.App;
            Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            DoubleBuffered = true;

            TableLayoutPanel shell = new TableLayoutPanel();
            shell.Dock = DockStyle.Fill;
            shell.Padding = new Padding(24, 22, 24, 22);
            shell.BackColor = BackColor;
            shell.ColumnCount = 1;
            shell.RowCount = 6;
            shell.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 84F));
            shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 78F));
            shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 232F));
            shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 78F));
            shell.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            shell.RowStyles.Add(new RowStyle(SizeType.Absolute, 42F));
            Controls.Add(shell);

            Panel header = new Panel();
            header.Dock = DockStyle.Fill;
            header.BackColor = BackColor;
            header.Margin = new Padding(0);
            shell.Controls.Add(header, 0, 0);

            Control mark = MakeBrandMark();
            header.Controls.Add(mark);

            Label title = new Label();
            title.Text = AppName;
            title.ForeColor = Ui.Text;
            title.Font = new Font("Segoe UI Semibold", 23F, FontStyle.Bold);
            title.AutoSize = true;
            title.Location = new Point(74, 8);
            header.Controls.Add(title);

            Label subtitle = new Label();
            subtitle.Text = "Control Center untuk Dashboard, OpenClaw Gateway, dan MySQL Database.";
            subtitle.ForeColor = Ui.Muted;
            subtitle.Font = new Font("Segoe UI", 9.5F, FontStyle.Regular);
            subtitle.AutoSize = true;
            subtitle.Location = new Point(77, 45);
            header.Controls.Add(subtitle);

            PillLabel brandChip = new PillLabel();
            brandChip.Text = "CONTROL CENTER";
            brandChip.ForeColor = Ui.PrimaryDark;
            brandChip.BackColor = Ui.PrimarySoft;
            brandChip.BorderColor = Ui.PrimaryLine;
            brandChip.Radius = 13;
            brandChip.Font = new Font("Segoe UI Semibold", 8.5F, FontStyle.Bold);
            brandChip.TextAlign = ContentAlignment.MiddleCenter;
            brandChip.Size = new Size(142, 28);
            brandChip.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            brandChip.Location = new Point(header.Width - brandChip.Width, 15);
            brandChip.AutoSize = false;
            header.Controls.Add(brandChip);
            header.Resize += delegate
            {
                brandChip.Location = new Point(Math.Max(0, header.ClientSize.Width - brandChip.Width), 15);
            };

            CardPanel actionCard = new CardPanel();
            actionCard.Dock = DockStyle.Fill;
            actionCard.Margin = new Padding(0, 0, 0, 14);
            actionCard.Padding = new Padding(16, 11, 16, 11);
            actionCard.BackColor = Ui.Surface;
            actionCard.Radius = 8;
            shell.Controls.Add(actionCard, 0, 1);

            TableLayoutPanel actionLayout = new TableLayoutPanel();
            actionLayout.Dock = DockStyle.Fill;
            actionLayout.ColumnCount = 2;
            actionLayout.RowCount = 1;
            actionLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 30F));
            actionLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 70F));
            actionLayout.BackColor = Ui.Surface;
            actionCard.Controls.Add(actionLayout);

            Panel actionCopy = new Panel();
            actionCopy.Dock = DockStyle.Fill;
            actionCopy.BackColor = Ui.Surface;
            actionLayout.Controls.Add(actionCopy, 0, 0);

            Label actionTitle = new Label();
            actionTitle.Text = "Quick Actions";
            actionTitle.ForeColor = Ui.Text;
            actionTitle.Font = new Font("Segoe UI Semibold", 10.75F, FontStyle.Bold);
            actionTitle.AutoSize = true;
            actionTitle.Location = new Point(0, 1);
            actionCopy.Controls.Add(actionTitle);

            Label actionSubtitle = new Label();
            actionSubtitle.Text = "Login, cek AI, dashboard, dan log.";
            actionSubtitle.ForeColor = Ui.Muted;
            actionSubtitle.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            actionSubtitle.AutoSize = true;
            actionSubtitle.Location = new Point(0, 27);
            actionCopy.Controls.Add(actionSubtitle);

            FlowLayoutPanel actions = new FlowLayoutPanel();
            actions.FlowDirection = FlowDirection.LeftToRight;
            actions.WrapContents = false;
            actions.Dock = DockStyle.Fill;
            actions.BackColor = Ui.Surface;
            actions.Padding = new Padding(0, 2, 0, 0);
            actionLayout.Controls.Add(actions, 1, 0);

            Button loginButton = MakeButton("Login OAuth", Ui.PrimarySoft);
            loginButton.Click += delegate { RunLoginOAuth(); };
            actions.Controls.Add(loginButton);

            Button closeLoginButton = MakeButton("Close Login", Ui.DangerSoft);
            closeLoginButton.Click += delegate { StopLoginOAuth(); };
            actions.Controls.Add(closeLoginButton);

            Button openButton = MakeButton("Open Dashboard", Ui.Primary);
            openButton.Click += delegate { OpenUrl("http://localhost:18888"); };
            actions.Controls.Add(openButton);

            Button testButton = MakeButton("Cek AI", Ui.PrimarySoft);
            testButton.Click += delegate { TestAi(); };
            actions.Controls.Add(testButton);

            Button logsButton = MakeButton("Open Logs", Ui.PrimarySoft);
            logsButton.Click += delegate { OpenLogs(); };
            actions.Controls.Add(logsButton);

            TableLayoutPanel services = new TableLayoutPanel();
            services.ColumnCount = 3;
            services.RowCount = 1;
            services.Dock = DockStyle.Fill;
            services.Margin = new Padding(0, 0, 0, 14);
            services.BackColor = BackColor;
            services.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.333F));
            services.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.333F));
            services.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.334F));
            shell.Controls.Add(services, 0, 2);

            dashboard = new ServiceView("KUNEKU Dashboard", "http://localhost:18888", 18888);
            dashboard.Panel.Margin = new Padding(0, 0, 12, 0);
            dashboard.StartClicked += delegate { StartDashboard(); };
            dashboard.StopClicked += delegate { StopPort(18888, "Dashboard"); };
            services.Controls.Add(dashboard.Panel, 0, 0);

            gateway = new ServiceView("OpenClaw Gateway", "http://localhost:18789/v1/responses", 18789);
            gateway.Panel.Margin = new Padding(0, 0, 12, 0);
            gateway.StartClicked += delegate { StartGateway(); };
            gateway.StopClicked += delegate { StopPort(18789, "OpenClaw Gateway"); };
            services.Controls.Add(gateway.Panel, 1, 0);

            mysql = new ServiceView("MySQL Database", "127.0.0.1:3306", 3306);
            mysql.Panel.Margin = new Padding(0);
            mysql.StartClicked += delegate { StartMySql(); };
            mysql.StopClicked += delegate { StopMySql(); };
            services.Controls.Add(mysql.Panel, 2, 0);

            CardPanel bulkCard = new CardPanel();
            bulkCard.Dock = DockStyle.Fill;
            bulkCard.Margin = new Padding(0, 0, 0, 14);
            bulkCard.Padding = new Padding(16, 10, 16, 10);
            bulkCard.BackColor = Ui.Surface;
            bulkCard.Radius = 8;
            shell.Controls.Add(bulkCard, 0, 3);

            TableLayoutPanel bulkLayout = new TableLayoutPanel();
            bulkLayout.Dock = DockStyle.Fill;
            bulkLayout.ColumnCount = 2;
            bulkLayout.RowCount = 1;
            bulkLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 44F));
            bulkLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 56F));
            bulkLayout.BackColor = Ui.Surface;
            bulkCard.Controls.Add(bulkLayout);

            Panel bulkCopy = new Panel();
            bulkCopy.Dock = DockStyle.Fill;
            bulkCopy.BackColor = Ui.Surface;
            bulkLayout.Controls.Add(bulkCopy, 0, 0);

            Label bulkTitle = new Label();
            bulkTitle.Text = "Service Controls";
            bulkTitle.ForeColor = Ui.Text;
            bulkTitle.Font = new Font("Segoe UI Semibold", 10.5F, FontStyle.Bold);
            bulkTitle.AutoSize = true;
            bulkTitle.Location = new Point(0, 1);
            bulkCopy.Controls.Add(bulkTitle);

            Label bulkSubtitle = new Label();
            bulkSubtitle.Text = "Kelola semua service dari satu tempat.";
            bulkSubtitle.ForeColor = Ui.Muted;
            bulkSubtitle.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            bulkSubtitle.AutoSize = true;
            bulkSubtitle.Location = new Point(0, 26);
            bulkCopy.Controls.Add(bulkSubtitle);

            FlowLayoutPanel bulk = new FlowLayoutPanel();
            bulk.FlowDirection = FlowDirection.LeftToRight;
            bulk.WrapContents = false;
            bulk.Dock = DockStyle.Fill;
            bulk.BackColor = Ui.Surface;
            bulkLayout.Controls.Add(bulk, 1, 0);

            Button startAll = MakeButton("Start All", Ui.Primary);
            startAll.Click += delegate { StartDashboard(); StartGateway(); StartMySql(); };
            bulk.Controls.Add(startAll);

            Button stopAll = MakeButton("Stop All", Ui.DangerSoft);
            stopAll.Click += delegate { StopPort(18888, "Dashboard"); StopPort(18789, "OpenClaw Gateway"); StopMySql(); };
            bulk.Controls.Add(stopAll);

            Button refresh = MakeButton("Refresh Status", Ui.PrimarySoft);
            refresh.Click += delegate { RefreshStatus(); };
            bulk.Controls.Add(refresh);

            CardPanel logCard = new CardPanel();
            logCard.Dock = DockStyle.Fill;
            logCard.Margin = new Padding(0, 0, 0, 12);
            logCard.Padding = new Padding(18, 14, 18, 18);
            logCard.BackColor = Ui.Surface;
            logCard.Radius = 8;
            shell.Controls.Add(logCard, 0, 4);

            TableLayoutPanel logLayout = new TableLayoutPanel();
            logLayout.Dock = DockStyle.Fill;
            logLayout.ColumnCount = 1;
            logLayout.RowCount = 2;
            logLayout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            logLayout.RowStyles.Add(new RowStyle(SizeType.Absolute, 46F));
            logLayout.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            logLayout.BackColor = Ui.Surface;
            logCard.Controls.Add(logLayout);

            Panel logHeader = new Panel();
            logHeader.Dock = DockStyle.Fill;
            logHeader.BackColor = Ui.Surface;
            logLayout.Controls.Add(logHeader, 0, 0);

            Label logTitle = new Label();
            logTitle.Text = "Activity Log";
            logTitle.ForeColor = Ui.Text;
            logTitle.Font = new Font("Segoe UI Semibold", 11F, FontStyle.Bold);
            logTitle.AutoSize = true;
            logTitle.Location = new Point(0, 0);
            logHeader.Controls.Add(logTitle);

            Label logSubtitle = new Label();
            logSubtitle.Text = "Runtime event dan hasil pemeriksaan service.";
            logSubtitle.ForeColor = Ui.Muted;
            logSubtitle.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            logSubtitle.AutoSize = true;
            logSubtitle.Location = new Point(1, 23);
            logHeader.Controls.Add(logSubtitle);

            CardPanel logBody = new CardPanel();
            logBody.Dock = DockStyle.Fill;
            logBody.Margin = new Padding(0);
            logBody.Padding = new Padding(12);
            logBody.BackColor = Ui.LogBack;
            logBody.BorderColor = Ui.Border;
            logBody.Radius = 8;
            logLayout.Controls.Add(logBody, 0, 1);

            logBox = new TextBox();
            logBox.Multiline = true;
            logBox.ReadOnly = true;
            logBox.ScrollBars = ScrollBars.Vertical;
            logBox.WordWrap = false;
            logBox.ShortcutsEnabled = true;
            logBox.Dock = DockStyle.Fill;
            logBox.BackColor = Ui.LogBack;
            logBox.ForeColor = Ui.Text;
            logBox.BorderStyle = BorderStyle.None;
            logBox.Font = new Font("Consolas", 9.5F);
            logBody.Controls.Add(logBox);

            Panel ownerFooter = MakeOwnerFooter();
            shell.Controls.Add(ownerFooter, 0, 5);

            timer = new Timer();
            timer.Interval = 2500;
            timer.Tick += delegate { RefreshStatus(); };
            timer.Start();

            AppendLog("KUNEKU siap. Klik Start manual untuk menjalankan service.");
            RefreshStatus();
        }

        private Panel MakeOwnerFooter()
        {
            Panel footer = new Panel();
            footer.Dock = DockStyle.Fill;
            footer.BackColor = Ui.App;
            footer.Margin = new Padding(0);
            footer.Padding = new Padding(0, 8, 0, 0);

            Label copyright = new Label();
            copyright.Text = "Copyright 2026 " + OwnerName + ". All rights reserved.";
            copyright.ForeColor = Ui.Text;
            copyright.Font = new Font("Segoe UI Semibold", 8.75F, FontStyle.Bold);
            copyright.AutoSize = true;
            copyright.Location = new Point(0, 12);
            footer.Controls.Add(copyright);

            Action alignFooter = delegate
            {
                copyright.Location = new Point(
                    Math.Max(0, footer.ClientSize.Width - copyright.Width),
                    12
                );
            };
            footer.Resize += delegate { alignFooter(); };
            footer.Layout += delegate { alignFooter(); };
            alignFooter();

            return footer;
        }

        private void TryApplyWindowIcon()
        {
            string iconPath = Path.Combine(rootDir, "control-panel", "kuneku.ico");
            if (!File.Exists(iconPath)) return;

            try
            {
                Icon = new Icon(iconPath);
            }
            catch
            {
            }
        }

        private static string ResolveRoot()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
            if (Directory.Exists(Path.Combine(baseDir, "forms-gpt-agent")))
            {
                return baseDir;
            }

            DirectoryInfo parent = Directory.GetParent(baseDir);
            if (parent != null && Directory.Exists(Path.Combine(parent.FullName, "forms-gpt-agent")))
            {
                return parent.FullName;
            }

            return baseDir;
        }

        private static Button MakeButton(string text, Color backColor)
        {
            ModernButton button = new ModernButton();
            button.Text = text;
            button.AutoSize = false;
            button.Size = new Size(128, 40);
            button.Margin = new Padding(5, 2, 5, 2);
            button.ButtonBackColor = backColor;
            button.HoverBackColor = ButtonHover(backColor);
            button.BorderColor = ButtonBorder(backColor);
            button.TextColor = ButtonText(backColor);
            button.BackColor = backColor;
            button.ForeColor = ButtonText(backColor);
            button.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            button.UseVisualStyleBackColor = false;
            return button;
        }

        private Control MakeBrandMark()
        {
            string logoPath = Path.Combine(rootDir, "images", "background-hitam.png");
            if (File.Exists(logoPath))
            {
                RoundedPictureBox picture = new RoundedPictureBox();
                picture.Image = Image.FromFile(logoPath);
                picture.SizeMode = PictureBoxSizeMode.Zoom;
                picture.BackColor = Color.Black;
                picture.Size = new Size(56, 56);
                picture.Location = new Point(0, 8);
                return picture;
            }

            Label fallback = new Label();
            fallback.Text = "K";
            fallback.ForeColor = Color.Black;
            fallback.BackColor = Ui.Primary;
            fallback.Font = new Font("Segoe UI", 18F, FontStyle.Bold);
            fallback.TextAlign = ContentAlignment.MiddleCenter;
            fallback.Size = new Size(56, 56);
            fallback.Location = new Point(0, 8);
            return fallback;
        }

        internal static Color ButtonText(Color backColor)
        {
            if (backColor.ToArgb() == Ui.PrimarySoft.ToArgb()) return Ui.Primary;
            if (backColor.ToArgb() == Ui.DangerSoft.ToArgb()) return Ui.Danger;
            return Color.White;
        }

        internal static Color ButtonBorder(Color backColor)
        {
            if (backColor.ToArgb() == Ui.DangerSoft.ToArgb()) return Ui.DangerLine;
            if (backColor.ToArgb() == Ui.PrimarySoft.ToArgb()) return Ui.PrimaryLine;
            return Ui.Primary;
        }

        internal static Color ButtonHover(Color backColor)
        {
            if (backColor.ToArgb() == Ui.DangerSoft.ToArgb()) return Color.FromArgb(254, 226, 226);
            if (backColor.ToArgb() == Ui.PrimarySoft.ToArgb()) return Color.FromArgb(213, 247, 253);
            return Ui.Primary;
        }

        private void StartDashboard()
        {
            if (GetPidOnPort(18888) > 0)
            {
                AppendLog("Dashboard sudah berjalan di http://localhost:18888");
                return;
            }

            string bat = Path.Combine(rootDir, "control-panel", "run-dashboard-service.bat");
            StartHiddenBatch(bat);
            AppendLog("Start Dashboard diminta. Tunggu beberapa detik, lalu status akan hijau.");
        }

        private void StartGateway()
        {
            if (GetPidOnPort(18789) > 0)
            {
                AppendLog("OpenClaw Gateway sudah berjalan di http://localhost:18789");
                return;
            }

            string bat = Path.Combine(rootDir, "control-panel", "run-openclaw-gateway-service.bat");
            StartHiddenBatch(bat);
            AppendLog("Start OpenClaw Gateway diminta. Pastikan OAuth sudah login.");
        }

        private void StartMySql()
        {
            if (GetPidOnPort(3306) > 0)
            {
                AppendLog("MySQL Database sudah berjalan di 127.0.0.1:3306");
                RefreshStatus();
                return;
            }

            string mysqld = FindPortableMySqlServer();
            if (!string.IsNullOrEmpty(mysqld))
            {
                if (StartPortableMySql(mysqld))
                {
                    RefreshStatus();
                    return;
                }
            }

            string serviceName = FindMySqlServiceName();
            if (!string.IsNullOrEmpty(serviceName))
            {
                try
                {
                    using (ServiceController service = new ServiceController(serviceName))
                    {
                        if (service.Status != ServiceControllerStatus.Running &&
                            service.Status != ServiceControllerStatus.StartPending)
                        {
                            service.Start();
                        }
                        service.WaitForStatus(ServiceControllerStatus.Running, TimeSpan.FromSeconds(15));
                    }

                    AppendLog("Start MySQL Database berhasil via Windows service: " + serviceName + ".");
                    RefreshStatus();
                    return;
                }
                catch (Exception ex)
                {
                    AppendLog("Gagal start MySQL service " + serviceName + ": " + ex.Message + ". Jalankan Control Center sebagai Administrator jika service butuh izin.");
                }
            }

            AppendLog("MySQL Database belum bisa dijalankan. Pastikan portable MySQL lengkap atau Windows service MySQL/MariaDB tersedia.");
            RefreshStatus();
        }

        private bool StartPortableMySql(string mysqld)
        {
            try
            {
                string binDir = Path.GetDirectoryName(mysqld);
                string baseDir = Directory.GetParent(binDir).FullName;
                string dataDir = Path.Combine(baseDir, "data");
                string configFile = Path.Combine(baseDir, "kuneku-my.ini");
                Directory.CreateDirectory(logsDir);
                EnsurePortableMySqlConfig(baseDir, dataDir, configFile);

                if (!Directory.Exists(Path.Combine(dataDir, "mysql")))
                {
                    AppendLog("Setup data MySQL portable pertama kali. Ini bisa butuh beberapa detik.");
                    string initLog = Path.Combine(logsDir, "mysql-init.log");
                    int initExit = RunProcessToLog(
                        mysqld,
                        "--defaults-file=\"" + configFile + "\" --initialize-insecure --console",
                        binDir,
                        initLog,
                        90000
                    );

                    if (initExit != 0 || !Directory.Exists(Path.Combine(dataDir, "mysql")))
                    {
                        AppendLog("Setup MySQL portable gagal. Cek log: " + initLog);
                        return false;
                    }
                }

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = mysqld;
                psi.Arguments = "--defaults-file=\"" + configFile + "\"";
                psi.WorkingDirectory = binDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                Process.Start(psi);

                if (WaitForPort(3306, 15))
                {
                    AppendLog("Start MySQL Database portable berhasil di 127.0.0.1:3306.");
                    return true;
                }

                AppendLog("Start MySQL portable diminta, tapi port 3306 belum aktif. Cek log di folder logs atau file error MySQL.");
                return false;
            }
            catch (Exception ex)
            {
                AppendLog("Gagal start MySQL portable: " + ex.Message);
                return false;
            }
        }

        private void EnsurePortableMySqlConfig(string baseDir, string dataDir, string configFile)
        {
            Directory.CreateDirectory(dataDir);
            string logDir = logsDir;
            Directory.CreateDirectory(logDir);
            string content =
                "[mysqld]" + Environment.NewLine +
                "basedir=" + ToMySqlPath(baseDir) + Environment.NewLine +
                "datadir=" + ToMySqlPath(dataDir) + Environment.NewLine +
                "port=3306" + Environment.NewLine +
                "bind-address=127.0.0.1" + Environment.NewLine +
                "mysqlx=OFF" + Environment.NewLine +
                "character-set-server=utf8mb4" + Environment.NewLine +
                "collation-server=utf8mb4_unicode_ci" + Environment.NewLine +
                "default-storage-engine=InnoDB" + Environment.NewLine +
                "log-error=" + ToMySqlPath(Path.Combine(logDir, "mysql-error.log")) + Environment.NewLine +
                Environment.NewLine +
                "[client]" + Environment.NewLine +
                "host=127.0.0.1" + Environment.NewLine +
                "port=3306" + Environment.NewLine +
                "user=root" + Environment.NewLine +
                "default-character-set=utf8mb4" + Environment.NewLine;

            File.WriteAllText(configFile, content, new UTF8Encoding(false));
        }

        private static string ToMySqlPath(string path)
        {
            return path.Replace("\\", "/");
        }

        private bool WaitForPort(int port, int seconds)
        {
            DateTime limit = DateTime.Now.AddSeconds(seconds);
            while (DateTime.Now < limit)
            {
                if (GetPidOnPort(port) > 0) return true;
                Application.DoEvents();
                System.Threading.Thread.Sleep(500);
            }
            return GetPidOnPort(port) > 0;
        }

        private int RunProcessToLog(string fileName, string arguments, string workingDirectory, string logFile, int timeoutMs)
        {
            string command = "\"" + fileName + "\" " + arguments + " > \"" + logFile + "\" 2>&1";
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "cmd.exe";
            psi.Arguments = "/c " + command;
            psi.WorkingDirectory = workingDirectory;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.WindowStyle = ProcessWindowStyle.Hidden;

            using (Process process = Process.Start(psi))
            {
                if (!process.WaitForExit(timeoutMs))
                {
                    try { process.Kill(); } catch { }
                    return -1;
                }
                return process.ExitCode;
            }
        }

        private void StopMySql()
        {
            string mysqld = FindPortableMySqlServer();
            if (!string.IsNullOrEmpty(mysqld) && StopPortableMySql(mysqld))
            {
                RefreshStatus();
                return;
            }

            string serviceName = FindRunningMySqlServiceName();
            if (!string.IsNullOrEmpty(serviceName))
            {
                try
                {
                    using (ServiceController service = new ServiceController(serviceName))
                    {
                        if (service.Status != ServiceControllerStatus.Stopped &&
                            service.Status != ServiceControllerStatus.StopPending)
                        {
                            service.Stop();
                        }
                        service.WaitForStatus(ServiceControllerStatus.Stopped, TimeSpan.FromSeconds(15));
                    }

                    AppendLog("Stop MySQL Database berhasil via Windows service: " + serviceName + ".");
                    RefreshStatus();
                    return;
                }
                catch (Exception ex)
                {
                    AppendLog("Gagal stop MySQL service " + serviceName + ": " + ex.Message + ". Jalankan Control Center sebagai Administrator jika service butuh izin.");
                }
            }

            StopPort(3306, "MySQL Database");
        }

        private bool StopPortableMySql(string mysqld)
        {
            if (GetPidOnPort(3306) <= 0) return false;

            try
            {
                string binDir = Path.GetDirectoryName(mysqld);
                string baseDir = Directory.GetParent(binDir).FullName;
                string mysqladmin = Path.Combine(binDir, "mysqladmin.exe");
                if (!File.Exists(mysqladmin)) return false;

                string dataDir = Path.Combine(baseDir, "data");
                string configFile = Path.Combine(baseDir, "kuneku-my.ini");
                EnsurePortableMySqlConfig(baseDir, dataDir, configFile);
                Directory.CreateDirectory(logsDir);

                int exitCode = RunProcessToLog(
                    mysqladmin,
                    "--defaults-file=\"" + configFile + "\" -uroot shutdown",
                    binDir,
                    Path.Combine(logsDir, "mysql-shutdown.log"),
                    15000
                );

                DateTime limit = DateTime.Now.AddSeconds(8);
                while (DateTime.Now < limit && GetPidOnPort(3306) > 0)
                {
                    Application.DoEvents();
                    System.Threading.Thread.Sleep(500);
                }

                if (GetPidOnPort(3306) <= 0)
                {
                    AppendLog("Stop MySQL Database portable berhasil.");
                    return true;
                }

                if (exitCode != 0)
                {
                    AppendLog("Shutdown MySQL portable gagal. Fallback ke stop port 3306.");
                }
            }
            catch (Exception ex)
            {
                AppendLog("Gagal shutdown MySQL portable: " + ex.Message);
            }

            return false;
        }

        private void RunLoginOAuth()
        {
            string bat = Path.Combine(rootDir, "login-openclaw-codex.bat");
            if (!File.Exists(bat))
            {
                AppendLog("File login-openclaw-codex.bat tidak ditemukan.");
                return;
            }

            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "cmd.exe";
            psi.Arguments = "/c \"" + bat + "\"";
            psi.WorkingDirectory = rootDir;
            psi.UseShellExecute = true;
            psi.WindowStyle = ProcessWindowStyle.Normal;
            Process.Start(psi);
            AppendLog("Window Login OAuth dibuka. Setelah 'OpenAI OAuth complete', klik Close Login atau tutup CMD manual.");
        }

        private void StopLoginOAuth()
        {
            int killed = 0;

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "wmic.exe";
                psi.Arguments = "process where \"CommandLine like '%openclaw%models auth login%' or CommandLine like '%login-openclaw-codex.bat%'\" get ProcessId /value";
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.RedirectStandardOutput = true;

                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit(5000);
                    string[] lines = output.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                    for (int i = 0; i < lines.Length; i++)
                    {
                        string line = lines[i].Trim();
                        if (!line.StartsWith("ProcessId=", StringComparison.OrdinalIgnoreCase)) continue;

                        int pid;
                        if (int.TryParse(line.Substring("ProcessId=".Length), out pid) && pid > 0)
                        {
                            try
                            {
                                Process.GetProcessById(pid).Kill();
                                killed++;
                            }
                            catch
                            {
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                AppendLog("Gagal membaca proses Login OAuth: " + ex.Message);
                return;
            }

            if (killed > 0)
            {
                AppendLog("Login OAuth ditutup. Proses dimatikan: " + killed.ToString() + ".");
            }
            else
            {
                AppendLog("Tidak ada proses Login OAuth yang perlu ditutup.");
            }

            RefreshStatus();
        }

        private void StartHiddenBatch(string bat)
        {
            if (!File.Exists(bat))
            {
                AppendLog("File service tidak ditemukan: " + bat);
                return;
            }

            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "cmd.exe";
            psi.Arguments = "/c \"" + bat + "\"";
            psi.WorkingDirectory = rootDir;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.WindowStyle = ProcessWindowStyle.Hidden;
            Process.Start(psi);
        }

        private string FindMySqlServiceName()
        {
            string running = FindRunningMySqlServiceName();
            if (!string.IsNullOrEmpty(running)) return running;

            string[] preferred = new string[]
            {
                "KUNEKU-MySQL",
                "MySQL80",
                "MySQL",
                "MySQL57",
                "MySQL56",
                "MariaDB",
                "MariaDB10"
            };

            try
            {
                ServiceController[] services = ServiceController.GetServices();
                for (int i = 0; i < preferred.Length; i++)
                {
                    for (int j = 0; j < services.Length; j++)
                    {
                        if (string.Equals(services[j].ServiceName, preferred[i], StringComparison.OrdinalIgnoreCase))
                        {
                            return services[j].ServiceName;
                        }
                    }
                }

                for (int j = 0; j < services.Length; j++)
                {
                    string name = services[j].ServiceName;
                    string display = services[j].DisplayName;
                    if (name.IndexOf("mysql", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        name.IndexOf("mariadb", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        display.IndexOf("mysql", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        display.IndexOf("mariadb", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        return services[j].ServiceName;
                    }
                }
            }
            catch
            {
            }

            return null;
        }

        private string FindRunningMySqlServiceName()
        {
            try
            {
                ServiceController[] services = ServiceController.GetServices();
                for (int i = 0; i < services.Length; i++)
                {
                    string name = services[i].ServiceName;
                    string display = services[i].DisplayName;
                    bool looksLikeMysql =
                        name.IndexOf("mysql", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        name.IndexOf("mariadb", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        display.IndexOf("mysql", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        display.IndexOf("mariadb", StringComparison.OrdinalIgnoreCase) >= 0;

                    if (looksLikeMysql && services[i].Status == ServiceControllerStatus.Running)
                    {
                        return services[i].ServiceName;
                    }
                }
            }
            catch
            {
            }

            return null;
        }

        private string FindPortableMySqlServer()
        {
            string[] candidates = new string[]
            {
                Path.Combine(rootDir, "control-panel", "mysql", "bin", "mysqld.exe"),
                Path.Combine(rootDir, "control-panel", "mariadb", "bin", "mysqld.exe"),
                Path.Combine(rootDir, "mysql", "bin", "mysqld.exe"),
                Path.Combine(rootDir, "mariadb", "bin", "mysqld.exe"),
                Path.Combine(rootDir, "database", "mysql", "bin", "mysqld.exe"),
                Path.Combine(rootDir, "db", "mysql", "bin", "mysqld.exe")
            };

            for (int i = 0; i < candidates.Length; i++)
            {
                if (File.Exists(candidates[i])) return candidates[i];
            }

            string[] parents = new string[]
            {
                Path.Combine(rootDir, "control-panel"),
                rootDir,
                Path.Combine(rootDir, "database"),
                Path.Combine(rootDir, "db")
            };

            for (int i = 0; i < parents.Length; i++)
            {
                if (!Directory.Exists(parents[i])) continue;

                string found = FindPortableMySqlServerInPattern(parents[i], "mysql-*");
                if (!string.IsNullOrEmpty(found)) return found;

                found = FindPortableMySqlServerInPattern(parents[i], "mariadb-*");
                if (!string.IsNullOrEmpty(found)) return found;
            }

            return null;
        }

        private string FindPortableMySqlServerInPattern(string parent, string pattern)
        {
            try
            {
                string[] dirs = Directory.GetDirectories(parent, pattern, SearchOption.TopDirectoryOnly);
                for (int i = 0; i < dirs.Length; i++)
                {
                    string candidate = Path.Combine(dirs[i], "bin", "mysqld.exe");
                    if (File.Exists(candidate)) return candidate;
                }
            }
            catch
            {
            }

            return null;
        }

        private void StopPort(int port, string name)
        {
            int pid = GetPidOnPort(port);
            if (pid <= 0)
            {
                AppendLog(name + " belum berjalan.");
                RefreshStatus();
                return;
            }

            try
            {
                Process process = Process.GetProcessById(pid);
                process.Kill();
                AppendLog("Stop " + name + " berhasil. PID " + pid + " dimatikan.");
            }
            catch (Exception ex)
            {
                AppendLog("Gagal stop " + name + ": " + ex.Message);
            }

            RefreshStatus();
        }

        private int GetPidOnPort(int port)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "netstat.exe";
                psi.Arguments = "-ano -p tcp";
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.RedirectStandardOutput = true;

                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit(3000);
                    string[] lines = output.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                    string needle = ":" + port.ToString();

                    for (int i = 0; i < lines.Length; i++)
                    {
                        string line = lines[i].Trim();
                        if (line.IndexOf(needle, StringComparison.OrdinalIgnoreCase) >= 0 &&
                            line.IndexOf("LISTENING", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            string[] parts = line.Split(new char[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                            if (parts.Length > 0)
                            {
                                int pid;
                                if (int.TryParse(parts[parts.Length - 1], out pid))
                                {
                                    return pid;
                                }
                            }
                        }
                    }
                }
            }
            catch
            {
            }

            return 0;
        }

        private void RefreshStatus()
        {
            int dashboardPid = GetPidOnPort(18888);
            int gatewayPid = GetPidOnPort(18789);
            int mysqlPid = GetPidOnPort(3306);
            dashboard.SetStatus(dashboardPid);
            gateway.SetStatus(gatewayPid);
            mysql.SetStatus(mysqlPid);
        }

        private void TestAi()
        {
            if (GetPidOnPort(18888) <= 0)
            {
                AppendLog("Dashboard belum berjalan. Start Dashboard dulu.");
                return;
            }
            if (GetPidOnPort(18789) <= 0)
            {
                AppendLog("OpenClaw Gateway belum berjalan. Start Gateway dulu.");
                return;
            }

            try
            {
                using (WebClient client = new WebClient())
                {
                    client.Encoding = Encoding.UTF8;
                    client.Headers[HttpRequestHeader.ContentType] = "application/json";
                    string body = "{\"provider\":\"openclaw\",\"baseUrl\":\"http://localhost:18789/v1/responses\",\"model\":\"openai-codex/gpt-5.4\",\"apiKey\":\"\",\"customRulesText\":\"\"}";
                    string response = client.UploadString("http://localhost:18888/api/test-ai", "POST", body);
                    AppendLog("Cek AI berhasil: " + response);
                }
            }
            catch (Exception ex)
            {
                AppendLog("Cek AI gagal: " + ex.Message);
            }
        }

        private void OpenUrl(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                AppendLog("Gagal membuka " + url + ": " + ex.Message);
            }
        }

        private void OpenLogs()
        {
            try
            {
                Directory.CreateDirectory(logsDir);
                Process.Start(new ProcessStartInfo(logsDir) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                AppendLog("Gagal membuka folder logs: " + ex.Message);
            }
        }

        private void AppendLog(string message)
        {
            string line = DateTime.Now.ToString("HH:mm:ss") + "  " + message;
            logBox.AppendText(line + Environment.NewLine);
        }
    }

    public class ServiceView
    {
        public Panel Panel;
        private Label statusLabel;
        private Label pidLabel;
        public event EventHandler StartClicked;
        public event EventHandler StopClicked;

        public ServiceView(string title, string endpoint, int port)
        {
            Panel = new CardPanel();
            Panel.Dock = DockStyle.Fill;
            Panel.Margin = new Padding(0);
            Panel.Padding = new Padding(18, 18, 18, 16);
            Panel.BackColor = Ui.Surface;
            ((CardPanel)Panel).Radius = 8;
            ((CardPanel)Panel).BorderColor = Ui.Border;

            TableLayoutPanel layout = new TableLayoutPanel();
            layout.Dock = DockStyle.Fill;
            layout.ColumnCount = 1;
            layout.RowCount = 3;
            layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 76F));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 52F));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100F));
            layout.BackColor = Ui.Surface;
            Panel.Controls.Add(layout);

            TableLayoutPanel header = new TableLayoutPanel();
            header.Dock = DockStyle.Fill;
            header.ColumnCount = 2;
            header.RowCount = 2;
            header.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 56F));
            header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            header.RowStyles.Add(new RowStyle(SizeType.Absolute, 34F));
            header.RowStyles.Add(new RowStyle(SizeType.Absolute, 28F));
            header.BackColor = Ui.Surface;
            layout.Controls.Add(header, 0, 0);

            PillLabel iconLabel = new PillLabel();
            iconLabel.Text = title.IndexOf("Dashboard", StringComparison.OrdinalIgnoreCase) >= 0
                ? "D"
                : title.IndexOf("MySQL", StringComparison.OrdinalIgnoreCase) >= 0 ? "DB" : "G";
            iconLabel.ForeColor = Ui.PrimaryDark;
            iconLabel.BackColor = Ui.PrimarySoft;
            iconLabel.BorderColor = Ui.PrimaryLine;
            iconLabel.Radius = 8;
            iconLabel.Font = new Font("Segoe UI", 13F, FontStyle.Bold);
            iconLabel.TextAlign = ContentAlignment.MiddleCenter;
            iconLabel.Size = new Size(44, 44);
            iconLabel.Margin = new Padding(0, 0, 12, 0);
            iconLabel.Anchor = AnchorStyles.Left | AnchorStyles.Top;
            header.Controls.Add(iconLabel, 0, 0);
            header.SetRowSpan(iconLabel, 2);

            Label titleLabel = new Label();
            titleLabel.Text = title;
            titleLabel.ForeColor = Ui.Text;
            titleLabel.Font = new Font("Segoe UI Semibold", 12F, FontStyle.Bold);
            titleLabel.AutoSize = false;
            titleLabel.AutoEllipsis = true;
            titleLabel.Dock = DockStyle.Fill;
            titleLabel.TextAlign = ContentAlignment.MiddleLeft;
            titleLabel.Margin = new Padding(0, 0, 0, 0);
            header.Controls.Add(titleLabel, 1, 0);

            Label endpointLabel = new Label();
            endpointLabel.Text = endpoint;
            endpointLabel.ForeColor = Ui.Muted;
            endpointLabel.AutoSize = false;
            endpointLabel.AutoEllipsis = true;
            endpointLabel.Dock = DockStyle.Fill;
            endpointLabel.TextAlign = ContentAlignment.MiddleLeft;
            endpointLabel.Margin = new Padding(0, 0, 0, 0);
            header.Controls.Add(endpointLabel, 1, 1);

            TableLayoutPanel meta = new TableLayoutPanel();
            meta.Dock = DockStyle.Fill;
            meta.ColumnCount = 3;
            meta.RowCount = 1;
            meta.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 124F));
            meta.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 116F));
            meta.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
            meta.BackColor = Ui.Surface;
            layout.Controls.Add(meta, 0, 1);

            statusLabel = new PillLabel();
            statusLabel.Text = "STOPPED";
            statusLabel.ForeColor = Ui.Danger;
            statusLabel.BackColor = Ui.DangerSoft;
            ((PillLabel)statusLabel).BorderColor = Ui.DangerLine;
            ((PillLabel)statusLabel).Radius = 13;
            statusLabel.Font = new Font("Segoe UI Semibold", 9.5F, FontStyle.Bold);
            statusLabel.TextAlign = ContentAlignment.MiddleCenter;
            statusLabel.AutoSize = false;
            statusLabel.Size = new Size(110, 30);
            statusLabel.Anchor = AnchorStyles.Left | AnchorStyles.Top;
            statusLabel.Margin = new Padding(0, 8, 12, 0);
            meta.Controls.Add(statusLabel, 0, 0);

            Label portLabel = MakeInfoChip("Port: " + port.ToString());
            portLabel.Margin = new Padding(0, 8, 12, 0);
            meta.Controls.Add(portLabel, 1, 0);

            pidLabel = MakeInfoChip("PID: -");
            pidLabel.Text = "PID: -";
            pidLabel.Margin = new Padding(0, 8, 0, 0);
            meta.Controls.Add(pidLabel, 2, 0);

            FlowLayoutPanel footer = new FlowLayoutPanel();
            footer.Dock = DockStyle.Fill;
            footer.FlowDirection = FlowDirection.RightToLeft;
            footer.WrapContents = false;
            footer.BackColor = Ui.Surface;
            footer.Padding = new Padding(0, 8, 0, 0);
            layout.Controls.Add(footer, 0, 2);

            Button startButton = MainFormButton("Start", Ui.Primary);
            startButton.Click += delegate
            {
                if (StartClicked != null) StartClicked(this, EventArgs.Empty);
            };

            Button stopButton = MainFormButton("Stop", Ui.DangerSoft);
            stopButton.Click += delegate
            {
                if (StopClicked != null) StopClicked(this, EventArgs.Empty);
            };

            footer.Controls.Add(stopButton);
            footer.Controls.Add(startButton);
        }

        private static Label MakeInfoChip(string text)
        {
            PillLabel label = new PillLabel();
            label.Text = text;
            label.ForeColor = Ui.Muted;
            label.BackColor = Ui.SurfaceSoft;
            label.BorderColor = Ui.Border;
            label.Radius = 8;
            label.Font = new Font("Segoe UI", 8.75F, FontStyle.Regular);
            label.TextAlign = ContentAlignment.MiddleCenter;
            label.AutoSize = false;
            label.Size = new Size(98, 30);
            label.Anchor = AnchorStyles.Left | AnchorStyles.Top;
            return label;
        }

        private static Button MainFormButton(string text, Color backColor)
        {
            ModernButton button = new ModernButton();
            button.Text = text;
            button.Size = new Size(92, 38);
            button.Margin = new Padding(5, 0, 0, 0);
            button.ButtonBackColor = backColor;
            button.HoverBackColor = MainForm.ButtonHover(backColor);
            button.BorderColor = MainForm.ButtonBorder(backColor);
            button.TextColor = MainForm.ButtonText(backColor);
            button.BackColor = backColor;
            button.ForeColor = MainForm.ButtonText(backColor);
            button.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            button.UseVisualStyleBackColor = false;
            return button;
        }

        public void SetStatus(int pid)
        {
            if (pid > 0)
            {
                statusLabel.Text = "RUNNING";
                statusLabel.ForeColor = Ui.Success;
                statusLabel.BackColor = Ui.SuccessSoft;
                ((PillLabel)statusLabel).BorderColor = Ui.SuccessLine;
                pidLabel.Text = "PID: " + pid.ToString();
            }
            else
            {
                statusLabel.Text = "STOPPED";
                statusLabel.ForeColor = Ui.Danger;
                statusLabel.BackColor = Ui.DangerSoft;
                ((PillLabel)statusLabel).BorderColor = Ui.DangerLine;
                pidLabel.Text = "PID: -";
            }
            statusLabel.Invalidate();
        }
    }

    public class CardPanel : Panel
    {
        public int Radius = 8;
        public Color BorderColor = Ui.Border;

        public CardPanel()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        }

        protected override void OnResize(EventArgs eventargs)
        {
            base.OnResize(eventargs);
            if (Width <= 0 || Height <= 0) return;
            Rectangle rect = new Rectangle(0, 0, Width, Height);
            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            {
                Region old = Region;
                Region = new Region(path);
                if (old != null) old.Dispose();
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.Clear(Parent != null ? Parent.BackColor : BackColor);
            Rectangle rect = ClientRectangle;
            rect.Width -= 1;
            rect.Height -= 1;
            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            using (SolidBrush brush = new SolidBrush(BackColor))
            using (Pen pen = new Pen(BorderColor))
            {
                e.Graphics.FillPath(brush, path);
                e.Graphics.DrawPath(pen, path);
            }
        }
    }

    public class ModernButton : Button
    {
        private bool hovered;
        private bool pressed;

        public int Radius = 7;
        public Color ButtonBackColor = Ui.Primary;
        public Color HoverBackColor = Ui.Primary;
        public Color BorderColor = Ui.Primary;
        public Color TextColor = Color.White;

        public ModernButton()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
            FlatStyle = FlatStyle.Flat;
            FlatAppearance.BorderSize = 0;
            Cursor = Cursors.Hand;
        }

        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);
            if (Width <= 0 || Height <= 0) return;
            Rectangle rect = new Rectangle(0, 0, Width, Height);
            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            {
                Region old = Region;
                Region = new Region(path);
                if (old != null) old.Dispose();
            }
        }

        protected override void OnMouseEnter(EventArgs e)
        {
            hovered = true;
            Invalidate();
            base.OnMouseEnter(e);
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            hovered = false;
            pressed = false;
            Invalidate();
            base.OnMouseLeave(e);
        }

        protected override void OnMouseDown(MouseEventArgs mevent)
        {
            pressed = true;
            Invalidate();
            base.OnMouseDown(mevent);
        }

        protected override void OnMouseUp(MouseEventArgs mevent)
        {
            pressed = false;
            Invalidate();
            base.OnMouseUp(mevent);
        }

        protected override void OnEnabledChanged(EventArgs e)
        {
            Invalidate();
            base.OnEnabledChanged(e);
        }

        protected override void OnPaint(PaintEventArgs pevent)
        {
            pevent.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            pevent.Graphics.Clear(Parent != null ? Parent.BackColor : BackColor);
            Rectangle rect = ClientRectangle;
            rect.Width -= 1;
            rect.Height -= 1;

            Color fill = Enabled ? (hovered || pressed ? HoverBackColor : ButtonBackColor) : Ui.Disabled;
            Color border = Enabled ? BorderColor : Ui.Border;
            Color text = Enabled ? TextColor : Ui.DisabledText;

            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            using (SolidBrush brush = new SolidBrush(fill))
            using (Pen pen = new Pen(border))
            {
                pevent.Graphics.FillPath(brush, path);
                pevent.Graphics.DrawPath(pen, path);
            }

            TextRenderer.DrawText(
                pevent.Graphics,
                Text,
                Font,
                ClientRectangle,
                text,
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis
            );
        }
    }

    public class PillLabel : Label
    {
        public int Radius = 12;
        public Color BorderColor = Ui.PrimaryLine;

        public PillLabel()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        }

        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);
            if (Width <= 0 || Height <= 0) return;
            Rectangle rect = new Rectangle(0, 0, Width, Height);
            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            {
                Region old = Region;
                Region = new Region(path);
                if (old != null) old.Dispose();
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.Clear(Parent != null ? Parent.BackColor : BackColor);
            Rectangle rect = ClientRectangle;
            rect.Width -= 1;
            rect.Height -= 1;

            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            using (SolidBrush brush = new SolidBrush(BackColor))
            using (Pen pen = new Pen(BorderColor))
            {
                e.Graphics.FillPath(brush, path);
                e.Graphics.DrawPath(pen, path);
            }

            TextRenderer.DrawText(
                e.Graphics,
                Text,
                Font,
                ClientRectangle,
                ForeColor,
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis
            );
        }
    }

    public class RoundedPictureBox : PictureBox
    {
        public int Radius = 16;
        public Color BorderColor = Color.FromArgb(18, 32, 44);

        public RoundedPictureBox()
        {
            SetStyle(ControlStyles.ResizeRedraw, true);
        }

        protected override void OnResize(EventArgs e)
        {
            base.OnResize(e);
            if (Width <= 0 || Height <= 0) return;
            Rectangle rect = new Rectangle(0, 0, Width, Height);
            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            {
                Region old = Region;
                Region = new Region(path);
                if (old != null) old.Dispose();
            }
        }

        protected override void OnPaint(PaintEventArgs pe)
        {
            base.OnPaint(pe);
            pe.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = ClientRectangle;
            rect.Width -= 1;
            rect.Height -= 1;
            using (GraphicsPath path = Ui.RoundedRect(rect, Radius))
            using (Pen pen = new Pen(BorderColor))
            {
                pe.Graphics.DrawPath(pen, path);
            }
        }
    }
}
