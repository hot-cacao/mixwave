set -e
eslint "packages/api/src/**/*.ts"
echo "✅ eslint(api)"
eslint "packages/artisan/src/**/*.ts"
echo "✅ eslint(artisan)"
eslint "packages/player/src/**/*.ts"
echo "✅ eslint(player)"
eslint "packages/shared/src/**/*.ts"
echo "✅ eslint(shared)"
eslint "packages/dashboard/src/**/*.ts" "packages/dashboard/src/**/*.tsx"
echo "✅ eslint(dashboard)"
eslint "packages/stitcher/src/**/*.ts"
echo "✅ eslint(stitcher)"