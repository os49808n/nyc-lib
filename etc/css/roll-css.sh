#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
rm -rf $DIR/tmp
rm -rf $DIR/build
mkdir $DIR/tmp
mkdir $DIR/build
cp $DIR/*.css $DIR/tmp/
cp $1 $DIR/tmp/
cp $2 $DIR/tmp/
theme=$(basename $1)
other=$(basename $2)
echo $full
if [ $full != null ]; then
  full="nyc-ol-lib.css"
else
  full="nyc-ol-fullscreen-lib.css"
fi
cat $DIR/tmp/$theme >> $DIR/tmp/base.theme.css
cat $DIR/tmp/$other >> $DIR/tmp/nyc-ol-lib.css
postcss $DIR/tmp/nyc-ol-lib.css --o $DIR/build/nyc.ol.$theme --no-map --config $DIR
cat $DIR/tmp/$other >> $DIR/tmp/nyc-lib.css
postcss $DIR/tmp/nyc-lib.css --o $DIR/build/nyc.$theme --no-map --config $DIR
rm -rf $DIR/tmp
