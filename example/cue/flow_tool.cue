package config

import (
	"tool/file"
	"encoding/yaml"
)

#Workflow: {
	_name:      string
	_category:  string
	apiVersion: "v1"
	kind:       "Pod"
	metadata: {
		name: _name
		labels: category: _category
	}
	spec: containers: [{
		name:  _name
		image: "my-image:latest"
	}]
}

command: run: {
	mkdir: file.MkdirAll & {
		path: "out/workspaces/\(config.workspace_name)/"
	}

	create: file.Create & {
		$dep:     mkdir.$done
		filename: "out/workspaces/\(config.workspace_name)/workspace.yaml"
		contents: yaml.Marshal(#Workflow & {_name: config.workspace_name, _category: config.category})
	}
}
