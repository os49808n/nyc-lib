package gov.nyc.doitt.nyc.gis.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.tasks.TaskAction
import org.apache.tools.ant.taskdefs.condition.Os

class JsDocTask extends DefaultTask {
	def jsdocDir = '../node_modules/.bin'
	def isWindows = Os.isFamily(Os.FAMILY_WINDOWS)
	def sourceDir = ''
	def destinationDir = ''
	@TaskAction
	public void build(){
		def docs = new File(destinationDir)
		def exe = isWindows ? new File("${jsdocDir}/jsdoc.cmd") : new File("${jsdocDir}/jsdoc") 
		if (exe.exists()){
			docs.mkdirs()
			def cmd = "${exe} ${sourceDir} -d ${destinationDir} -r -c etc/jsdoc/conf.json --verbose"
			println cmd
			def proc = cmd.execute()
			proc.waitForProcessOutput(System.out, System.err)
		}else{
			println '-------------------------------------------------------------------------'
			println	"	File '${cmd.getAbsolutePath()}' not found!"
			println	'	Install JsDoc (https://github.com/jsdoc3/jsdoc) or'
			println	"	set 'jsdocDir' property on task '${this.getName()}'."
			println	"	Skipping task '${this.getName()}'!"
			println '-------------------------------------------------------------------------'
		}
	}
}