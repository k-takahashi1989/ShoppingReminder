package com.ktakahashi.shoppingreminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * 端末再起動後にジオフェンス監視を復帰させるための BroadcastReceiver
 *
 * 実際の監視再開は React Native 側 (App.tsx) で行われるため、
 * ここではアプリのプロセスを起動させるだけにとどめる。
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            // アプリプロセスを起動 → App.tsx の useEffect で自動的に監視が再開される
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (launchIntent != null) {
                context.startActivity(launchIntent)
            }
        }
    }
}
