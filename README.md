
Hi everyone, thank for your interest in this project. This is the
pre-alpha version of Connected Notes (as in, many major features are still missing), a note taking app based on Zettelkasten.
Sorry for the delay, I know I said I'd try to get something out in May but I
moved out of my apartment over the weekend and was quite busy.

I have set up a test version at connectednotes.net - please don't use it for
anything serious, but I'd love to get some feedback.

# Goals

- A modern take on Zettelkasten
- Progressive web app (PWA) usable from both mobile and desktop
- Low upkeep cost combined with open-sourcing to give reasonable long-term support 
- Give users as much control over their notes as possible
  - Notes are mainly synced in personal cloud (currently Google Drive works)
  - Store notes in plain text with any metadata stored separately
  - Possibly support for local notes (although so far only Chrome has any sort of filesystem API available)
- Currently markdown based (maybe provide WYSIWYG editor as alternative?)
- Graph view for exploring notes easily
- Open source (duh)

# Current status

Integration with Google Drive works - however, since this is pre-alpha
changes are possible and I won't yet guarantee any backwards-compatibility.

# Running locally

First, run npm install && ng serve

Then, navigate to localhost:4200/gd for the Google Drive backed version

# Major missing features

- Support for tags (search, visualization)
- Search from note contents (not just titles)
- Folders
- Reasonable offline support
- Responsiveness
- Settings to control eg. showing timestamps on notes
- Proper testing with browsers other than Chrome
- Dark mode
- Sorting notes by different criteria (eg. creation time, modification time)

On the technical side, needs more tests (currently only some default tests exist).

# Tech stack

Angular 9 is the main framework. Codemirror is used to provide markdown
highlighting, marked.js provides markdown rendering and d3 the graph view. 

Everything is Typescript.

# Comparison to other Zettelkasten-ish note taking apps

While there are some
other open source Zettelkasten based note taking apps (shoutout to the great
Zettlr) AFAIK none of those provide direct integration with cloud storage and
accessibility via web/mobile.

Also, most such apps (open source or not) are currently based on Electron.
While Electron is powerful and well-supported, I think it carries long-term risks that
PWAs don't have. Namely, Electron apps must be kept up-to-date by manually releasing
new versions based on the the latest Electron, whereas PWAs can rely on the user to keep
their browser udpated which reduces the maintenance load.
Also, code signing Electron apps is not trivial.
This makes it more crucial to have support from a commercial company or dedicated
maintainers for Electron apps, where the same doesn't apply for PWAs (at least to same extent).

# Planned timeline

Get major missing features working by the end of July and push out 1.0.

Responsiveness and offline support are probably the biggest time sinks so those might
get cut from 1.0 depending on how much time there is.

# Contact me

tsiki @ freenode/IRCnet (yes that's IRC, yes I'm oldschool)
