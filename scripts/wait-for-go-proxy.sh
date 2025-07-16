#!/bin/bash
set -e

# Wait for Go proxy to index a module version
# Usage: ./wait-for-go-proxy.sh <module> <version>

MODULE="${1}"
VERSION="${2}"

if [ -z "$MODULE" ] || [ -z "$VERSION" ]; then
    echo "Usage: $0 <module> <version>"
    echo "Example: $0 github.com/org/repo v1.2.3"
    exit 1
fi

echo "Waiting for Go proxy to index ${MODULE}@${VERSION}..."

# Configuration
MAX_ATTEMPTS=${GO_PROXY_MAX_ATTEMPTS:-30}
SLEEP_TIME=${GO_PROXY_SLEEP_TIME:-10}

# Function to check if module is available
check_module() {
    go list -m "${MODULE}@${VERSION}" >/dev/null 2>&1
}

# Retry logic
for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "Attempt $i/$MAX_ATTEMPTS..."
    
    if check_module; then
        echo "✓ Module ${MODULE}@${VERSION} is available!"
        exit 0
    fi
    
    if [ $i -eq $MAX_ATTEMPTS ]; then
        echo "❌ Module not available after $MAX_ATTEMPTS attempts"
        exit 1
    fi
    
    echo "Module not yet available, waiting ${SLEEP_TIME}s..."
    sleep $SLEEP_TIME
done