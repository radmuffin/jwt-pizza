# Curiosity Report: Chrome Dev Tools Recorder

## Introduction
I was messing around with the Dev tools sometime last week when I noticed they had added a "Recorder" tab. I was pretty
curious what it was, so as I like to do with things like that when I'm not completely swamped with work to do, I went in
and tried it out.


## What it is
The recorder panel allows you to record, replay, and analyze user interactions on web pages. It's very similar to the
playwright code-generation feature, but built directly into the browser. The integration is super nice, and the first
thing I recorded was just scrolling around on some random website I was on at the time. Later I went to my deployment of
JWT Pizza and remade one of the tests I'd done in playwright. 

It was interesting the way it would record clicks. I later learned there is selector refinement you can do, but it seemed
to be going off of pixel coordinates for some of the clicks I would make. I also hadn't added assertions or waits for 
visibility for some of the actions I had done, so I had to slow down the replay of the interaction for it to work.

Recorder makes tests in puppeteer by default, but there is support for exporting to some other frameworks. It's even built
to be extendable with an API you can use to have custom integrations such as specific stringifies for proprietary test 
handling.

Another interesting feature is the combination with Chrome's performance panel, which allows developers to see detailed 
flame charts and resource utilization timelines during specific interactions. Additionally, integration with the chrome
debugging suite allows for setting breakpoints within recorded flows. This includes the recent addition of improved
call stack visibility showing asynchronous operations triggered during flows.

One cool incoming feature is the visual regression API which will programmatically compare DOM snapshots to detect 
unintended UI changes.

## Conclusion
Chrome Dev tools are a fun and very useful playground (I like running lighthouse reports on companies' websites as I'm
waiting for interviews). The recorder is another way of doing UI testing, and going down curiosity rabbit-holes is a 
lot of fun.
