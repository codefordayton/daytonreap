Dayton REAP
==========

Web application to streamline Dayton's REAP (Real Estate Acquisition Process) Program.

The process is described here: http://www.daytonohio.gov/187/Lot-Links

And a video walkthrough is here: https://www.youtube.com/watch?v=cIIOYG-B4NY

## Installation

Dayton REAP uses [npm](http://howtonode.org/introduction-to-npm) and [bower](http://bower.io/#install-bower). Follow those links to get the prerequisites installed before starting.

Once the toolchain is installed, simply run:
```
git clone https://github.com/codefordayton/daytonreap.git
cd daytonreap
npm install
bower install
npm run start
```

Running `npm start` will start a server, and should open a chrome window at http://localhost:8000/. If you get errors, make sure you have chrome installed on your machine. If you'd like to turn this feature off, open bsync-config.js and change `'open': true` to `'open': false`

If you run into any issues, don't hesitate to create an issue in this repo, or contact us via one of the methods described at http://codefordayton.org/.
