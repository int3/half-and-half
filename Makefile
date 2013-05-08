DESUGAR_TESTS := $(wildcard tests/desugar/*.js)

test: test-liveness test-desugar

test-liveness:
	@echo "testing liveness analysis... \c"
	@coffee tests/test_liveness.coffee
	@echo "passed"

test-desugar: $(DESUGAR_TESTS:.js=.result)

%.actual: %.js
	@echo "testing $<... \c"
	@coffee desugar.coffee $< | node > $@

%.expected: %.js
	@node $? > $@

%.result: %.actual %.expected
	@diff $?
	@echo "passed"
