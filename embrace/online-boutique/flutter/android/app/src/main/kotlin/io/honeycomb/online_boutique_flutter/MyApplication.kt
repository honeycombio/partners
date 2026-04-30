package io.honeycomb.online_boutique_flutter

import androidx.multidex.MultiDexApplication
import io.embrace.android.embracesdk.Embrace

class MyApplication : MultiDexApplication() {
    override fun onCreate() {
        super.onCreate()
        Embrace.getInstance().start(this)
    }
}
