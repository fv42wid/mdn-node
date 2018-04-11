var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GenreSchema = new Schema(
    {
        name: {type: String, required: true, min: 3, max: 100}
    }
);

//virtual for genre url
GenreSchema
.virtual('url')
.get(function() {
    return 'genre/' + this._id;
});

module.exports = mongoose.model('Genre', GenreSchema);