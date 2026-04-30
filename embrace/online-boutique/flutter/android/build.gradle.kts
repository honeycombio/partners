buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        val embSdk =
            run {
                val p = java.util.Properties()
                rootProject.file("gradle.properties").takeIf { it.exists() }?.reader()?.use { p.load(it) }
                p.getProperty("emb_android_sdk") ?: "8.2.0"
            }
        classpath("io.embrace:embrace-gradle-plugin:$embSdk")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
