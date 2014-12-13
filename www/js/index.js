var getDetails = function(data){
    var deff = $.map(data, function(obj, num){
        return $.Deferred(function( defer ) {
                getItem(obj)
                .then(function(data) {
                    defer.resolve(data);
                });
        }).promise()
    })
    return $.Deferred(function( defer ) {
        $.when.apply($, deff).then(function(){
            defer.resolve(arguments)
        })
    }).promise()
}

var getItem = function(id){
    return $.Deferred(function( defer ) {
        $.getJSON("https://hacker-news.firebaseio.com/v0/item/"+id+".json")
        .then(function(data) {
            defer.resolve(data);
        });
    }).promise()
}

var getTopStoriesIds = function(){
    return $.Deferred(function( defer ) {
        $.getJSON("https://hacker-news.firebaseio.com/v0/topstories.json")
        .then(function(data) {
          return defer.resolve(data)
        })
    }).promise()
}

var getTopStories = function(){
    return $.Deferred(function( defer ) {
        getTopStoriesIds()
        .then(function(data) {
          return getDetails(data)
        }).then(function(data){
            defer.resolve(data);
        });
    }).promise()
}


angular.module('todoApp', []).controller('Cntrl', ['$scope', function($scope) {
    $scope.readNode = function(node){
        if(node.kids[node.pos]){
            var childToRead = nodes[node.kids[node.pos]];
            if(childToRead){
                //console.log(childToRead.type)
                if(childToRead.type == "story" || childToRead.type == "job"){
                    $scope.$apply(function(){
                        $scope.textList.unshift(childToRead)
                    })
                    $scope.readText(childToRead.title).then(function(){
                        $scope.addToReadIds(node.kids[node.pos])
                        node.pos++;
                        setTimeout(function(){$scope.readNode(node)}, 500)
                    })
                }
            }else{
                getItem(node.kids[node.pos]).then(function(data){
                    data.pos = 0;
                    nodes[node.kids[node.pos]] = data;
                    $scope.readNode(node);
                })
            }
        }
    }
    
    $scope.readText = function(str){
        return $.Deferred(function( defer ) {
            if(str){
            var split = str.split(" ")
            var pos = 0;
            var timed = function(){
                $scope.$apply(function(){
                    $scope.reader = split[pos]
                })
                setTimeout(function(){
                    pos++;
                    if(pos >= split.length){
                        defer.resolve();
                    }else{
                        timed();
                    }
                },60000/350);
            }
            timed()
            }else{
                defer.resolve();
            }
        }).promise()
    }
    $scope.reader = "Trying to connect" 
    $scope.textList = []
    
    $scope.getReadIds = function(){
        var readIds = []
        try{
            readIds = $.parseJSON(localStorage.readIds)
        }catch(e){
        }
        return readIds
    }
    
    $scope.addToReadIds = function(id){
        var ids = $scope.getReadIds();
        ids.push(id)
        localStorage.readIds = JSON.stringify(ids)
    }
    
    var nodes = {}
    var curNode = null;
    
    getTopStoriesIds().then(function(ids){
        var readIds = $scope.getReadIds();
        console.log(readIds)
        ids = ids.filter(function(item) {
            return readIds.indexOf(item) === -1;
        });
        if(ids.length > 0){
            nodes[0] = {type: "frontPage", kids: ids, pos: 0}
            curNode = nodes[0]
            $scope.readNode(curNode)
        }else{
            $scope.$apply(function(){
                $scope.reader = "No unread posts"
            })
        }
    })
}]);