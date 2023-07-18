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
		path: "out/workspaces/\(values.workspace_name)/"
	}

	create: file.Create & {
		$dep:     mkdir.$done
		filename: "out/workspaces/\(values.workspace_name)/workspace.yaml"
		contents: yaml.Marshal(#Workflow & {_name: values.workspace_name, _category: values.category})
	}
}
