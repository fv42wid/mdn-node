var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

//display a list of all Authors
exports.author_list = function(req, res, next) {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function(err, list_authors) {
            if(err) {return next(err);}
            //successful so render
            res.render('author_list', {title: 'Author List', author_list: list_authors});
        });
};

//display detail page for a specific author
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
              .exec(callback)
        },
        authors_books: function(callback) {
            Book.find({'author': req.params.id}, 'title summary')
                .exec(callback)
        },
    }, function(err, results) {
        if(err) {return next(err);}
        if(results.author == null) {
            var err = new Error('Author not found');
            err.status = 404;
            return next(err);
        }
        //successful so render
        res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.authors_books});
    });
};

//display author create form on get
exports.author_create_get = function(req, res, next) {
    res.render('author_form', {title: 'Create Author'});
};

//handle author create on post
exports.author_create_post = [
    //validate fields
    body('first_name').isLength({min: 1}).trim().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters'),
    body('family_name').isLength({min: 1}).trim().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters'),
    body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601(),
    body('date_of_death', 'Invalid date of death').optional({checkFalsy: true}).isISO8601(),

    //sanitize fields
    sanitizeBody('first_name').trim().escape(),
    sanitizeBody('family_name').trim().escape(),
    sanitizeBody('date_of_birth').toDate(),
    sanitizeBody('date_of_death').toDate(),

    //process request after validation and sanitization
    (req, res, next) => {
        //extract the validation errors from a request
        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            //errors, rerender form
            res.render('author_form', {title: 'Create Author', author: req.body, errors: errors.array()});
            return;
        } else {
            //data is valid
            //create an author object with escaped and trimmed data
            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                }
            );
            author.save(function(err) {
                if(err) {return next(err);}
                //successful, redirect to new record
                res.redirect(author.url);
            });
        }
    }
];

//display author delete form on get
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
            Book.find({'author': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if(err) {return next(err);}
        if(results.author==null) {
            res.redirect('/catalog/authors');
        }
        res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books});
    });
};

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {

    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.authors_books.length > 0) {
            // Author has books. Render in same way as for GET route.
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                // Success - go to author list
                res.redirect('/catalog/authors')
            })
        }
    });
};

//display author update form on get
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update get');
};

//handle author update on post
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update post');
};