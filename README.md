# GEDCOM-Views Collection

A collection of simple webpages to display gedcom data. This is not an editor (yet)!

The Site is designed as PWA and will store no data on server side. Your Gedcom file is stored in yours browsers local storage.

## gedcom.js

The main structure of a GEDCOM file is defined in the v5.5.1 standard by
the "Church of Jesus Christ of Latter-day Saints".
A download link can be found on the german
["genealoby.net"-wiki](http://wiki-de.genealogy.net/Gedcom). 
This site does not support any other format.

Each line in a GEDCOM file is a record. By defining a specific "level" the
records form a tree-like structure. This tree is represented by the
`Record` class in `gedcom.js`. Some special versions of `Record` are
`Family` and `Individual` to easier handle cross references between these
types of record. See `gedcom.js` for details and available methods.


## Plugins

All views are "plug ins". Each folder contains a `gedview.json` file with some
meta data for the view. The folders are registers in the `plugins.json` file.
The order in the array will be the same as in the applications' menu.

`geview.json`:

    {
      "target":"index.html",
      "caption":"Menutitle",
      "resources":[
        "some.css",
        "main.js",
        "picture.jpg"
      ]
    }

### Entry point

Each plug-in should create a "`gedviewPage`" instance with a
`printGedviewFamily(fam, ged)` method. This is called as soon as all
data from the stored gedcom file is loaded and ready. This may be called
more than once.

The `fam` Parameter is the current selected `Family` record.
If the `id` of this family is `-1`, no family is selected and the plug in
should display an "empty" view.

The `ged` parameter is a link to the current `Gedcom` instance.


### basic scripts

Every plugin must include at least two script files.

    <script src="../gedcomjs/gedcom.js"></script>
    <script src="../gedview-base.js"></script>

The `gedview-base.js` file will handle the stored gedcom file and the call
to the entry point.


### Switching the current family

TODO: browse to `myplugin.html?<famidWithout@>`.
