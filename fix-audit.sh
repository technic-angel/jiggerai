#!/bin/bash

echo "Running npm audit fix for client..."
cd client
npm audit fix
cd ..

echo "Running npm audit fix for server..."
cd server
npm audit fix
cd ..

echo "Audit fix complete."