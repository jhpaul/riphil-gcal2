Exec { path => [ "/bin/", "/sbin/" , "/usr/bin/", "/usr/sbin/" ] }

exec { 'add-nodesource-repo':
	command => "curl -sL https://deb.nodesource.com/setup | sudo bash -",
}
exec { 'add-ubuntu-git-maintainers-repo':
	command => "add-apt-repository ppa:git-core/ppa",
}

class system-update {
	exec { 'apt-get update':
		command => 'apt-get update',
  }
}

class system-upgrade {
	exec { 'apt-get upgrade':
        	command => 'apt-get upgrade -y',
    }
}

class js_packages {
	package { "nodejs":
    		ensure => "latest"
    }
}
class tools_packages {
	package { "git":
		ensure => "latest"
	}
}
class update-npm {
	exec { 'update-npm':
		command => 'npm install -g npm@latest',
	}
}
class bower_install {
	exec { 'install-bower':
		command => 'npm install -g bower --no-bin-links',
	}
}

class grunt_install {
        exec { 'install-grunt':
                command => 'npm install -g grunt-cli --no-bin-links',
        }
}

# class googleapi_install {
#         exec { 'install-googleapi':
#                 command => 'npm install googleapis --save --no-bin-links & npm install google-auth-library --save --no-bin-links',
#         }
# }


include system-update
include system-upgrade
include js_packages
include tools_packages
include bower_install
include grunt_install
include googleapi_install
