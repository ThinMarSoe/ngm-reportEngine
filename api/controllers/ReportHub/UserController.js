/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  create: function(req, res) {

    // check params
    if (!req.param( 'user' )) {
      return res.json(401, { msg: 'user required!' });
    }

    // try to look up user using the provided username/email address
    User.findOne({
      username: req.param( 'user' ).username
      // or: [{
      //     username: req.param( 'user' ).username
      //   },{
      //     email: req.param( 'user' ).email
      //   }]
      // username: req.param( 'user' ).username
    }, function foundUser( err, user ) {

      // user exists
      if ( user ) return res.json({ err: true, msg: 'User already exists! Forgot password?' } );

      // else create user
      User
        .create( req.param( 'user' ) )
        .exec( function( err, user ) {

          // err
          if (err) return res.negotiate( err );
        
          // set token
          user.token = jwtToken.issueToken({ sid: user.id });

          // save
          user.save( function(err){
            //  return user
            // console.log('User with ID '+user.id+' now has token '+user.token);
            res.json( 200, user );
          });

        });

    });
  
  },

  // Check provided email address and password
  login: function (req, res) {

    // check params
    if (!req.param( 'user' )) {
      return res.json(401, { msg: 'user required' });
    }

    // try to look up user using the provided username/email address
    User.findOne({
      username: req.param( 'user' ).username
      // or: [{
      //     username: req.param( 'user' ).username
      //   },{
      //     email: req.param( 'user' ).email
      //   }]
    }, function foundUser( err, user ) {
      
      // generic error
      if (err) return res.negotiate( err );

      // user not found
      if (!user) return res.json({ err: true, msg: 'Invalid Username! User exists?' });

      // compare params passpwrd to the encrypted db password
      require( 'machinepack-passwords' ).checkPassword({
        passwordAttempt: req.param( 'user' ).password,
        encryptedPassword: user.password
      }).exec({

        // error
        error: function ( err ){
          return res.negotiate( err );
        },

        // password incorrect
        incorrect: function (){
          return res.json({ err: true, msg: 'Invalid Password! Forgot Password?' });
        },

        // on success
        success: function (){

          // update visit information
          user.visits = user.visits + 1;

          // add token
          user.token = jwtToken.issueToken({ sid: user.id });

          // save updates
          user.save( function( err ) {
              
            // err
            if( err ) return res.negotiate( err );
            
            // Send back user with token
            return res.json( 200, user );

          });

        }
      });
    });

  },
  
  // 
  updateLogin: function(req, res){

    // check params
    if ( !req.param( 'user' ) ) {
      return res.json(401, { msg: 'user required' });
    }
    
    // get user by username
    User
      .findOne({ username: req.param( 'user' ).username })
      .exec(function(err, user){
      
        // return error
        if (err) return res.negotiate( err );

        // return error
        // if (!user) return res.json( 401, { msg: 'User not found!' } );

        // update visit information
        user.visits++;

        // save updates
        user.save(function(err) {
          
          // err
          if(err) return res.negotiate( err );

          // return updated user
          return res.json( 200, user );

        });

      });

  },

  // update user profile
  updateProfile: function(req, res){

    // check params
    if ( !req.param( 'user' ) ) {
      return res.json(401, { msg: 'user required' });
    }

    // new profile
    var updatedUser = req.param( 'user' );

    // check to make sure username is not taken
    User.findOne({
      username: updatedUser.username
    }, function foundUser( err, user ) {

      // generic error
      if (err) return res.negotiate( err );
      
      // if username exists twice!
      if ( user && user.id !== updatedUser.id ) {

        // username already taken
        return res.json( 200, { err: true, msg: 'Username already taken, try again!' });

      } else {

        // check to make sure username is not taken
        User.findOne({
          id: updatedUser.id
        }, function foundUser( err, originalUser ) {
        
          User
            .update( { id: updatedUser.id }, updatedUser )
            .exec( function( err, result ){

              // generic error
              if (err) return res.negotiate( err );

              // user object to update tables
              var updatedRelationsUser = {
                username: result[0].username,
                name: result[0].name,
                position: result[0].position,
                phone: result[0].phone,
                email: result[0].email
              }

              // each collection needs to be updated - this needs to change to relational!

              // project
              Project
                .update({ username: originalUser.username }, updatedRelationsUser )
                .exec( function( err, project ){
                  // generic error
                  if (err) return res.negotiate( err );
                  
                  // budget
                  BudgetProgress
                    .update({ username: originalUser.username }, updatedRelationsUser )
                    .exec( function( err, budget ){
                      // generic error
                      if (err) return res.negotiate( err );
                      
                      // TargetBeneficairies
                      TargetBeneficiaries
                        .update({ username: originalUser.username }, updatedRelationsUser )
                        .exec( function( err, targetBeneficairies ){
                          // generic error
                          if (err) return res.negotiate( err );

                          // TargetLocations
                          TargetLocation
                            .update({ username: originalUser.username }, updatedRelationsUser )
                            .exec( function( err, targetLocations ){
                              // generic error
                              if (err) return res.negotiate( err );
                              
                              // Report
                              Report
                                .update({ username: originalUser.username }, updatedRelationsUser )
                                .exec( function( err, report ){
                                  // generic error
                                  if (err) return res.negotiate( err );
                                  
                                  // Location
                                  Location
                                    .update({ username: originalUser.username }, updatedRelationsUser )
                                    .exec( function( err, location ){
                                      // generic error
                                      if (err) return res.negotiate( err );
                                      
                                      // Beneficiaries
                                      Beneficiaries
                                        .update({ username: originalUser.username }, updatedRelationsUser )
                                        .exec( function( err, beneficiaries ){
                                          // generic error
                                          if (err) return res.negotiate( err );
                                          
                                          // Stock
                                          Stock
                                            .update({ username: originalUser.username }, updatedRelationsUser )
                                            .exec( function( err, stock ){
                                              // generic error
                                              if (err) return res.negotiate( err );
                                              
                                              // StockLocation
                                              StockLocation
                                                .update({ username: originalUser.username }, updatedRelationsUser )
                                                .exec( function( err, stockLocation ){
                                                  // generic error
                                                  if (err) return res.negotiate( err );
                                                  
                                                  // StockReport
                                                  StockReport
                                                    .update({ username: originalUser.username }, updatedRelationsUser )
                                                    .exec( function( err, stockReport ){
                                                      // generic error
                                                      if (err) return res.negotiate( err );
                                                      
                                                      // StockWarehouse
                                                      StockWarehouse
                                                        .update({ username: originalUser.username }, updatedRelationsUser )
                                                        .exec( function( err, stockWarehouse ){
                                                          // generic error
                                                          if (err) return res.negotiate( err );
                                                            
                                                            // return updated user
                                                            return res.json( 200, { success: true, user: result[0] } );

                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

        });
      
      }

    });

  },

  // 
  passwordResetEmail: function(req, res){

    // check params
    if ( !req.param( 'user' ) || !req.param( 'url' ) ) {
      return res.json(401, { msg: 'user, url required' });
    }

    // file system
    var fs = require('fs');
    
    // get user by email
    User
      .find({ email: req.param( 'user' ).email })
      .exec(function(err, user){

          // return error
          if (err) return res.negotiate( err );

          // return error
          if (!user.length) return res.json({ err: true, msg: 'Account Not Found!' });

          var resets = [],
              counter = 0,
              length = user.length;

          // 
          for (i = 0; i < user.length; i++) {

            // reset user
            var userReset = {
              adminRpcode: user[i].adminRpcode,
              admin0pcode: user[i].admin0pcode,         
              organization_id: user[i].organization_id,
              organization_tag: user[i].organization_tag,
              organization: user[i].organization,
              cluster_id: user[i].cluster_id,
              cluster: user[i].cluster,
              user_id: user[i].id,
              name: user[i].name,
              username: user[i].username,
              email: user[i].email,
              token: jwtToken.issueToken({ sid: user[i].id })
            }

            // Add record in reset
            UserReset
              .create( userReset )
              .exec( function( err, reset ) {

                // return error
                if (err) return res.negotiate( err );

                // push
                resets.push(reset);
                // incement
                counter++;
                if( counter === length ){

                  // if no config file, return, else send email ( PROD )
                  if ( !fs.existsSync( '/home/ubuntu/nginx/www/ngm-reportEngine/config/email.js' ) ) return res.json(200, { 'data': 'No email config' });

                  // send email
                  sails.hooks.email.send( 'password-reset', {
                      resets: resets,
                      recipientName: resets[0].username,
                      senderName: 'ReportHub',
                      url: req.param( 'url' ),
                    }, {
                      to: reset.email,
                      subject: 'ReportHub Password Reset ' + new Date()
                    }, function(err) {
                      
                      // return error
                      if (err) return res.negotiate( err );

                      // email sent
                      return res.json(200, { 'data': 'success' });
                  });
                }

              });

          }


        });

  },

  // 
  passwordReset: function(req, res){

    // check params
    if ( !req.param( 'reset' ) || !req.param( 'token' ) ) {
      return res.json(401, { msg: 'user, token required' });
    }

    // get reser user by username
    UserReset.findOne({ token: req.param( 'token' ) }).exec(function(err, userReset){

      // return error
      if (err) return res.negotiate( err );

      // return error
      if (!userReset) return res.json({ err: true, msg: 'Reset token not found!' });

      // get user with userReset params
      User
        .findOne({ username: userReset.username })
        .exec(function(err, user){

          // return error
          if (err) return res.negotiate( err );

          // update newPassword
          require( 'bcrypt' ).hash( req.param( 'reset' ).newPassword, 10, function passwordEncrypted( err, encryptedPassword ) {

            // err
            if ( err ) return res.json({ err: true, msg: 'Reset password error' } );

            // new password
            user.password = encryptedPassword;
            // add new token
            user.token = jwtToken.issueToken( { sid: user.id } );

            // save updates
            user.save( function( err ) {

              // err
              if ( err ) return res.negotiate( err );

              // return updated user
              return res.json( 200, user );

            });

          });

        });

    });

  }

};
