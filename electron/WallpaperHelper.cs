using System;
using System.Runtime.InteropServices;

public class WallpaperHelper
{
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam, uint fuFlags, uint uTimeout, out IntPtr lpdwResult);

    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

    [DllImport("user32.dll", SetLastError = true)]
    static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll", SetLastError = true)]
    static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    const int GWL_STYLE = -16;
    const int GWL_EXSTYLE = -20;
    const int WS_CHILD = 0x40000000;
    const int WS_POPUP = unchecked((int)0x80000000);
    const int WS_VISIBLE = 0x10000000;
    const int WS_EX_TOOLWINDOW = 0x00000080;
    const uint SWP_NOZORDER = 0x0004;
    const uint SWP_NOACTIVATE = 0x0010;
    const uint SWP_SHOWWINDOW = 0x0040;
    const uint SWP_FRAMECHANGED = 0x0020;

    static IntPtr GetWallpaperWorkerW()
    {
        IntPtr progman = FindWindow("Progman", null);
        IntPtr result;

        // Force Progman to spawn a WorkerW window behind desktop icons
        SendMessageTimeout(progman, 0x052C, new IntPtr(0xD), new IntPtr(0x1), 0, 1000, out result);

        IntPtr targetWorkerW = IntPtr.Zero;

        // Enumerate top-level windows to find the WorkerW that sits behind SHELLDLL_DefView
        EnumWindows((hWnd, lParam) =>
        {
            IntPtr shell = FindWindowEx(hWnd, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (shell != IntPtr.Zero)
            {
                targetWorkerW = FindWindowEx(IntPtr.Zero, hWnd, "WorkerW", null);
            }
            return true;
        }, IntPtr.Zero);

        // Fallback: If not found via sibling, find any WorkerW without a SHELLDLL_DefView
        if (targetWorkerW == IntPtr.Zero)
        {
            IntPtr w = IntPtr.Zero;
            while ((w = FindWindowEx(IntPtr.Zero, w, "WorkerW", null)) != IntPtr.Zero)
            {
                if (FindWindowEx(w, IntPtr.Zero, "SHELLDLL_DefView", null) == IntPtr.Zero)
                {
                    targetWorkerW = w;
                    break;
                }
            }
        }

        // Final fallback: attach directly to Progman
        if (targetWorkerW == IntPtr.Zero)
        {
            targetWorkerW = progman;
        }

        return targetWorkerW;
    }

    public static int Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("WORKERW: " + GetWallpaperWorkerW());
            return 0;
        }

        string cmd = args[0].ToLowerInvariant();

        if (cmd == "attach" && args.Length >= 2)
        {
            long hwndVal;
            if (!long.TryParse(args[1], out hwndVal))
            {
                Console.WriteLine("ERROR: Invalid HWND");
                return 1;
            }

            IntPtr childHwnd = new IntPtr(hwndVal);
            IntPtr workerW = GetWallpaperWorkerW();

            if (workerW == IntPtr.Zero)
            {
                Console.WriteLine("ERROR: Could not find WorkerW or Progman.");
                return 1;
            }

            // CRUCIAL: Remove WS_POPUP and add WS_CHILD & WS_VISIBLE so Windows message pump doesn't deadlock
            int style = GetWindowLong(childHwnd, GWL_STYLE);
            style = (style & ~WS_POPUP) | WS_CHILD | WS_VISIBLE;
            SetWindowLong(childHwnd, GWL_STYLE, style);

            int exStyle = GetWindowLong(childHwnd, GWL_EXSTYLE);
            exStyle |= WS_EX_TOOLWINDOW;
            SetWindowLong(childHwnd, GWL_EXSTYLE, exStyle);

            SetParent(childHwnd, workerW);

            int x = 0, y = 0, w = 1920, h = 1080;
            if (args.Length >= 6)
            {
                int.TryParse(args[2], out x);
                int.TryParse(args[3], out y);
                int.TryParse(args[4], out w);
                int.TryParse(args[5], out h);
            }

            SetWindowPos(childHwnd, IntPtr.Zero, x, y, w, h, SWP_NOZORDER | SWP_NOACTIVATE | SWP_SHOWWINDOW | SWP_FRAMECHANGED);
            Console.WriteLine("ATTACHED " + workerW);
            return 0;
        }
        else if (cmd == "detach" && args.Length >= 2)
        {
            long hwndVal;
            if (long.TryParse(args[1], out hwndVal))
            {
                IntPtr childHwnd = new IntPtr(hwndVal);
                SetParent(childHwnd, IntPtr.Zero);
                Console.WriteLine("DETACHED");
                return 0;
            }
            return 1;
        }

        Console.WriteLine("Usage: WallpaperHelper [attach <hwnd> [x y w h] | detach <hwnd>]");
        return 1;
    }
}
