const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')

const router = new express.Router();

// Create a new task
router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body);

    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch(e) {
        res.status(400).send(e);
    }
});

// Get all tasks
router.get('/tasks', auth, async (req, res) => {
    try {
        const sortFilter = {};
        let filter = {
            owner: req.user._id,
        }
        // /tasks/?completed=true
        if(req.query.completed) {
            filter.completed = req.query.completed === 'true';
        }

        // /tasks/?filter = <some description>
        if(req.query.filter) {
            filter.description = { $regex: '.*' + req.query.filter + '.*' , $options: 'i' };
        }

        // /tasks/?sortBy=description_asc
        if(req.query.sortBy) {
            const parts = req.query.sortBy.split('_');
            sortFilter[parts[0]] = parts[1] === 'asc' ? 1 : -1;
        }

        //supports limit and SKIP
        const tasks = await Task.find(filter).limit(parseInt(req.query.limit)).skip(parseInt(req.query.skip) * parseInt(req.query.limit)).sort(sortFilter);
        res.send(tasks);
    } catch(e) {
        res.status(500).send(e);
    }
});

// Get task by id
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if(!task) {
            return res.status(404).send('not found');
        }
        res.send(task);
    } catch(e) {
        res.status(500).send(e);
    }
});

// Update task by id 
router.patch('/tasks/:id', auth, async (req, res) => {

    const givenParams = Object.keys(req.body);
    const allowedParams = ['description', 'completed'];

    const isValidCall = givenParams.every((givenParam) => {
        return allowedParams.includes(givenParam);
    })

    if(!isValidCall) {
        return res.status(400).send({"error": "Invalid keys"});
    }

    try {
        const task = await Task.findOne({ owner: req.params.id, _id: req.user._id });

        if(!task) {
            return res.status(404).send('not found');
        }

        givenParams.forEach((givenParam) => {
            task[givenParam] = req.body[givenParam];
        });

        await task.save();
        
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Delete task by id
router.delete('/tasks/:id', auth, async(req, res) => {
    try {
        const task = await Task.findOneAndDelete({ owner:req.params.id, _id: req.user_id});
        if(!task) {
            return res.status(404).send('not found');
        }
        res.send(task);
    } catch (e) {
        return res.status(500).send(e);
    }
});

module.exports = router;