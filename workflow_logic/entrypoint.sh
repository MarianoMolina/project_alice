#!/bin/bash
set -e

# Ensure the Docker socket has the correct permissions
if [ -e /var/run/docker.sock ]; then
    chmod 666 /var/run/docker.sock
fi

# Run the main command as appuser
exec gosu appuser "$@"