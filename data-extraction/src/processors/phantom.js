// Requires
var phantom = require('phantom');

class PhantomInstancesPool{

    constructor(numberOfInstances){
        this.phantomChildren = [];
        this.numberOfInstances = numberOfInstances;
    }

    async init() {
        for(let i = 1; i <= this.numberOfInstances; i++){
            const instance = await this._createPhantomInstance();
            this.phantomChildren.push(instance);
        }
    }

    size() {
        return this.phantomChildren.length;
    }


    getPhantomInstance(position){
        return this.phantomChildren[position];
    }

    // getPhantomInstance() {
    //     if(this._isEmptySlotForNewInstance()){
    //         return this._createPhantomInstance()
    //     }
    //     const instance = this.phantomChildren.find( instance => instance.crawling === false);
    //     if(instance){
    //         return Promise.resolve(instance);
    //     }else{
    //         setTimeout(this.getPhantomInstance, 50);
    //     }
    // }

    async _createPhantomInstance() {
        const instance = phantom.create(['--ignore-ssl-errors=no', '--load-images=true'], {logLevel: 'error'})
        const phantomInstance = new PhantomInstance(instance, this);
        this.phantomChildren.push(phantomInstance);
        return phantomInstance;
    }

    async restartPhantomInstance(phantomInstance){
        this._removeInstance(phantomInstance);
        const newPhantomInstance = await this._createPhantomInstance();
        return newPhantomInstance;

    }

    _removeInstance(phantomInstance) {
        try{
            process.kill(phantomInstance.processId);
        } catch(err){
            //TODO logging
        }

       this.phantomChildren = this.phantomChildren.filter(function(instance){
           return instance.processId === phantomInstance.processId;
       });
    }

}

class PhantomInstance{

    constructor(phantomInstance, pool) {
        this.phantomInstance = phantomInstance;
        this.pool = pool;
        this.processId = phantomInstance.process.pid;
        this.iterationsCounter = 0; // how many iterations have run through this instance of phantom
        this.maxIterations = 20; // the max of websites to run through a phantom instance before creating a new one
        this.resourceTimeout = 7000; // timeout to wait for phantom
        this.websiteTimeout = 500; // time to wait for a website to load
    }

    async openPage(url) {
        try{
            const page = await this.phantomInstance.createPage();
            page.setting('resourceTimeout', this.resourceTimeout);
            await page.open(url);
            await delay(this.websiteTimeout); //give it some delay so that all content is loaded
            const content = await page.property('content');
            this.iterationsCounter++;
            return content;
        }catch(err){
            //TODO logging
            this._restartInstance();
        }

    }

    async startCrawling(queue) {
        this.extractData(queue);
    }

    async continueCrawling(queue){
        if(queue.isEmpty()){
            return;
        }
        if(this._isTimeToRestartInstance()){
            await this._restartInstance();
        }

        this.extractData(url);
    }

    async _restartInstance(){
        await this.pool.restartPhantomInstance(this);
    }

    _isTimeToRestartInstance(){
        return this.iterationsCounter >= this.maxIterations;
    }

    //todo do something with json data
    async extractData(queue) {
        const url = queue.dequeue();
        const processor = new DynamicPageProcessor(url, this);
        const jsonData = await processor.extractData();
        this.continueCrawling(queue);
        return jsonData;
    }


}