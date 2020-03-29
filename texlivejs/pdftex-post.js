self['postMessage'](JSON.stringify({'command': 'ready'}));
Module['calledRun']=false;
Module['thisProgram']='/latex';
FS.createDataFile("/",Module['thisProgram'],"dummy for kpathsea",true,true);
