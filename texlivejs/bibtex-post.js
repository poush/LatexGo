self['postMessage'](JSON.stringify({'command': 'ready'}));
Module['calledRun']=false;
Module['thisProgram']='/bibtex';
FS.createDataFile("/",Module['thisProgram'],"dummy for kpathsea",true,true);
